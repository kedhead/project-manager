import ExcelJS from 'exceljs';
import { parse } from 'json2csv';
import PDFDocument from 'pdfkit';
import { pool } from '../config/database';

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

  // Export to Excel
  static async exportToExcel(projectId: number, userId: number): Promise<Buffer> {
    const tasks = await this.getTasksForExport(projectId, userId);
    const project = await this.getProjectDetails(projectId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Project Manager';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Tasks');

    // Add project header
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Project: ${project.name}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Add metadata
    worksheet.getCell('A2').value = `Status: ${project.status}`;
    worksheet.getCell('A3').value = `Exported: ${new Date().toLocaleString()}`;
    worksheet.getCell('A4').value = `Total Tasks: ${tasks.length}`;

    // Add headers
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Assigned To',
      'Start Date',
      'End Date',
      'Duration (days)',
      'Progress (%)',
      'Subtasks',
      'Dependencies',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    tasks.forEach((task) => {
      worksheet.addRow([
        task.id,
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.assigned_user_name || 'Unassigned',
        task.start_date ? new Date(task.start_date).toLocaleDateString() : '',
        task.end_date ? new Date(task.end_date).toLocaleDateString() : '',
        task.duration || '',
        Math.round(task.progress * 100),
        task.subtask_count,
        task.dependency_count,
      ]);
    });

    // Auto-size columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Add filters
    worksheet.autoFilter = {
      from: { row: 6, column: 1 },
      to: { row: 6, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
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
}

export default ExportService;
