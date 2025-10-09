import ExcelJS from 'exceljs';
import { parse } from 'json2csv';
import PDFDocument from 'pdfkit';
import pool from '../config/database';

class ExportService {
  // Get tasks with all details for export
  static async getTasksForExport(projectId: number, userId: number) {
    const query = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.start_date,
        t.end_date,
        t.duration,
        t.progress,
        t.status,
        t.priority,
        t.created_at,
        t.updated_at,
        CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as assigned_user_name,
        assigned_user.email as assigned_user_email,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_user_name,
        (SELECT COUNT(*) FROM tasks subtasks WHERE subtasks.parent_task_id = t.id) as subtask_count,
        (SELECT COUNT(*) FROM task_dependencies WHERE task_id = t.id) as dependency_count
      FROM tasks t
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.project_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at ASC
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  // Get project details
  static async getProjectDetails(projectId: number) {
    const query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.start_date,
        p.end_date,
        p.status,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  // Export to Excel with modern styling
  static async exportToExcel(projectId: number, userId: number): Promise<Buffer> {
    const tasks = await this.getTasksForExport(projectId, userId);
    const project = await this.getProjectDetails(projectId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Project Manager';
    workbook.created = new Date();
    workbook.company = 'Project Manager App';

    const worksheet = workbook.addWorksheet('Tasks', {
      properties: { tabColor: { argb: 'FF6366F1' } }, // Indigo tab
    });

    // Modern color palette
    const colors = {
      primary: 'FF6366F1', // Indigo
      primaryLight: 'FFEDE9FE', // Light indigo
      success: 'FF10B981', // Green
      warning: 'FFF59E0B', // Amber
      danger: 'FFEF4444', // Red
      info: 'FF3B82F6', // Blue
      gray: 'FF6B7280', // Gray
      grayLight: 'FFF3F4F6', // Light gray
    };

    // Title Row - Modern branded header
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${project.name}`;
    titleCell.font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primary },
    };
    titleCell.border = {
      bottom: { style: 'thick', color: { argb: colors.primary } },
    };
    worksheet.getRow(1).height = 35;

    // Metadata Row with modern styling
    worksheet.mergeCells('A2:M2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Status: ${project.status.toUpperCase()} │ Total Tasks: ${tasks.length} │ Exported: ${new Date().toLocaleString()}`;
    metaCell.font = { size: 10, color: { argb: colors.gray }, italic: true };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.grayLight },
    };
    worksheet.getRow(2).height = 20;

    // Spacing row
    worksheet.getRow(3).height = 8;

    // Headers with modern gradient-like styling
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Assigned To',
      'Email',
      'Start Date',
      'End Date',
      'Duration',
      'Progress',
      'Subtasks',
      'Dependencies',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primary },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 28;

    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      };
    });

    // Add data with modern alternating row colors and conditional formatting
    tasks.forEach((task, index) => {
      const row = worksheet.addRow([
        task.id,
        task.title,
        task.description || '',
        task.status.replace(/_/g, ' ').toUpperCase(),
        task.priority.toUpperCase(),
        task.assigned_user_name || 'Unassigned',
        task.assigned_user_email || '',
        task.start_date ? new Date(task.start_date).toLocaleDateString() : '',
        task.end_date ? new Date(task.end_date).toLocaleDateString() : '',
        task.duration || '',
        Math.round(task.progress * 100),
        task.subtask_count,
        task.dependency_count,
      ]);

      // Alternating row colors
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors.grayLight },
          };
        });
      }

      // Status cell coloring
      const statusCell = row.getCell(4);
      statusCell.font = { bold: true };
      switch (task.status) {
        case 'completed':
          statusCell.font = { ...statusCell.font, color: { argb: colors.success } };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }, // Light green
          };
          break;
        case 'in_progress':
          statusCell.font = { ...statusCell.font, color: { argb: colors.info } };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' }, // Light blue
          };
          break;
        case 'blocked':
          statusCell.font = { ...statusCell.font, color: { argb: colors.danger } };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFECACA' }, // Light red
          };
          break;
        case 'cancelled':
          statusCell.font = { ...statusCell.font, color: { argb: colors.gray } };
          break;
      }

      // Priority cell coloring
      const priorityCell = row.getCell(5);
      priorityCell.font = { bold: true };
      switch (task.priority) {
        case 'critical':
          priorityCell.font = { ...priorityCell.font, color: { argb: colors.danger } };
          priorityCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFECACA' }, // Light red
          };
          break;
        case 'high':
          priorityCell.font = { ...priorityCell.font, color: { argb: colors.warning } };
          priorityCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }, // Light amber
          };
          break;
      }

      // Progress bar visualization
      const progressCell = row.getCell(11);
      const progressValue = Math.round(task.progress * 100);
      progressCell.value = `${progressValue}%`;
      if (progressValue >= 75) {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }, // Light green
        };
      } else if (progressValue >= 50) {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' }, // Light blue
        };
      } else if (progressValue >= 25) {
        progressCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }, // Light amber
        };
      }

      // Add subtle borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          left: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        };
      });

      row.alignment = { vertical: 'middle' };
      row.height = 22;
    });

    // Auto-size columns with better spacing
    worksheet.columns = [
      { key: 'id', width: 8 },
      { key: 'title', width: 30 },
      { key: 'description', width: 40 },
      { key: 'status', width: 15 },
      { key: 'priority', width: 12 },
      { key: 'assigned', width: 20 },
      { key: 'email', width: 25 },
      { key: 'start', width: 12 },
      { key: 'end', width: 12 },
      { key: 'duration', width: 10 },
      { key: 'progress', width: 10 },
      { key: 'subtasks', width: 10 },
      { key: 'deps', width: 12 },
    ];

    // Add auto-filter
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length },
    };

    // Freeze panes
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 4 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }

  // Export to CSV
  static async exportToCSV(projectId: number, userId: number): Promise<string> {
    const tasks = await this.getTasksForExport(projectId, userId);

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Description', value: 'description' },
      { label: 'Status', value: 'status' },
      { label: 'Priority', value: 'priority' },
      { label: 'Assigned To', value: 'assigned_user_name' },
      { label: 'Assigned Email', value: 'assigned_user_email' },
      { label: 'Start Date', value: (row: any) => row.start_date ? new Date(row.start_date).toLocaleDateString() : '' },
      { label: 'End Date', value: (row: any) => row.end_date ? new Date(row.end_date).toLocaleDateString() : '' },
      { label: 'Duration (days)', value: 'duration' },
      { label: 'Progress (%)', value: (row: any) => Math.round(row.progress * 100) },
      { label: 'Created By', value: 'created_user_name' },
      { label: 'Created At', value: (row: any) => new Date(row.created_at).toLocaleString() },
      { label: 'Subtasks', value: 'subtask_count' },
      { label: 'Dependencies', value: 'dependency_count' },
    ];

    const csv = parse(tasks, { fields });
    return csv;
  }

  // Export to PDF
  static async exportToPDF(projectId: number, userId: number): Promise<Buffer> {
    const tasks = await this.getTasksForExport(projectId, userId);
    const project = await this.getProjectDetails(projectId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(project.name, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Status: ${project.status}`);
      doc.text(`Exported: ${new Date().toLocaleString()}`);
      doc.text(`Total Tasks: ${tasks.length}`);
      doc.moveDown(2);

      // Tasks
      tasks.forEach((task, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(14).text(`${index + 1}. ${task.title}`, { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);

        if (task.description) {
          doc.text(`Description: ${task.description}`, { width: 500 });
        }

        doc.text(`Status: ${task.status} | Priority: ${task.priority}`);
        doc.text(`Assigned To: ${task.assigned_user_name || 'Unassigned'}`);

        if (task.start_date || task.end_date) {
          const startDate = task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set';
          const endDate = task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Not set';
          doc.text(`Timeline: ${startDate} → ${endDate}`);
        }

        if (task.duration) {
          doc.text(`Duration: ${task.duration} days`);
        }

        doc.text(`Progress: ${Math.round(task.progress * 100)}%`);

        if (task.subtask_count > 0 || task.dependency_count > 0) {
          doc.text(`Subtasks: ${task.subtask_count} | Dependencies: ${task.dependency_count}`);
        }

        doc.moveDown(1.5);
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    });
  }

  // Export to Google Sheets compatible format (optimized Excel)
  static async exportToGoogleSheets(projectId: number, userId: number): Promise<Buffer> {
    const tasks = await this.getTasksForExport(projectId, userId);
    const project = await this.getProjectDetails(projectId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Project Manager';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Tasks');

    // Google Sheets optimized header
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${project.name} - Task Export`;
    titleCell.font = { bold: true, size: 18, color: { argb: 'FF1A73E8' } }; // Google blue
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' }, // Light gray
    };

    // Metadata row
    worksheet.mergeCells('A2:M2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Status: ${project.status} | Tasks: ${tasks.length} | Exported: ${new Date().toLocaleString()}`;
    metaCell.font = { size: 10, color: { argb: 'FF5F6368' } }; // Gray
    metaCell.alignment = { horizontal: 'center' };

    // Add spacing
    worksheet.getRow(3).height = 5;

    // Headers with Google Sheets style
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Assigned To',
      'Email',
      'Start Date',
      'End Date',
      'Duration',
      'Progress',
      'Subtasks',
      'Dependencies',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A73E8' }, // Google blue
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data with alternating row colors
    tasks.forEach((task, index) => {
      const row = worksheet.addRow([
        task.id,
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.assigned_user_name || 'Unassigned',
        task.assigned_user_email || '',
        task.start_date ? new Date(task.start_date).toLocaleDateString() : '',
        task.end_date ? new Date(task.end_date).toLocaleDateString() : '',
        task.duration || '',
        Math.round(task.progress * 100),
        task.subtask_count,
        task.dependency_count,
      ]);

      // Alternating row colors (Google Sheets style)
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }, // Very light gray
        };
      }

      // Status color coding
      const statusCell = row.getCell(4);
      switch (task.status) {
        case 'completed':
          statusCell.font = { color: { argb: 'FF0F9D58' } }; // Green
          break;
        case 'in_progress':
          statusCell.font = { color: { argb: 'FF1A73E8' } }; // Blue
          break;
        case 'blocked':
          statusCell.font = { color: { argb: 'FFD93025' } }; // Red
          break;
      }

      // Priority color coding
      const priorityCell = row.getCell(5);
      switch (task.priority) {
        case 'critical':
          priorityCell.font = { bold: true, color: { argb: 'FFD93025' } }; // Red
          break;
        case 'high':
          priorityCell.font = { color: { argb: 'FFF4B400' } }; // Yellow/orange
          break;
      }
    });

    // Auto-size columns
    worksheet.columns?.forEach((column, index) => {
      if (!column || !column.eachCell) return;
      let maxLength = headers[index]?.length || 10;
      column.eachCell({ includeEmpty: false }, (cell: any) => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 3, 50);
    });

    // Add filters
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length },
    };

    // Freeze header rows
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 4 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }
}

export default ExportService;
