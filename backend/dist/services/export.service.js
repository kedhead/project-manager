"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceljs_1 = __importDefault(require("exceljs"));
const json2csv_1 = require("json2csv");
const pdfkit_1 = __importDefault(require("pdfkit"));
const database_1 = __importDefault(require("../config/database"));
class ExportService {
    // Get tasks with all details for export (including groups)
    static async getTasksForExport(projectId, userId) {
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
        g.name as assigned_group_name,
        g.color as assigned_group_color,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_user_name,
        (SELECT COUNT(*) FROM tasks subtasks WHERE subtasks.parent_task_id = t.id AND subtasks.deleted_at IS NULL) as subtask_count,
        (SELECT COUNT(*) FROM task_dependencies WHERE task_id = t.id) as dependency_count
      FROM tasks t
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN groups g ON t.assigned_group_id = g.id AND g.deleted_at IS NULL
      WHERE t.project_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at ASC
    `;
        const result = await database_1.default.query(query, [projectId]);
        return result.rows;
    }
    // Get project details
    static async getProjectDetails(projectId) {
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
        const result = await database_1.default.query(query, [projectId]);
        return result.rows[0];
    }
    // Export to Excel with modern styling
    static async exportToExcel(projectId, userId) {
        const tasks = await this.getTasksForExport(projectId, userId);
        const project = await this.getProjectDetails(projectId);
        const workbook = new exceljs_1.default.Workbook();
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
            const assignedTo = task.assigned_group_name
                ? `${task.assigned_group_name} (Group)`
                : (task.assigned_user_name || 'Unassigned');
            const row = worksheet.addRow([
                task.id,
                task.title,
                task.description || '',
                task.status.replace(/_/g, ' ').toUpperCase(),
                task.priority.toUpperCase(),
                assignedTo,
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
            }
            else if (progressValue >= 50) {
                progressCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDBEAFE' }, // Light blue
                };
            }
            else if (progressValue >= 25) {
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
        return buffer;
    }
    // Export to CSV
    static async exportToCSV(projectId, userId) {
        const tasks = await this.getTasksForExport(projectId, userId);
        const fields = [
            { label: 'ID', value: 'id' },
            { label: 'Title', value: 'title' },
            { label: 'Description', value: 'description' },
            { label: 'Status', value: 'status' },
            { label: 'Priority', value: 'priority' },
            {
                label: 'Assigned To',
                value: (row) => row.assigned_group_name
                    ? `${row.assigned_group_name} (Group)`
                    : (row.assigned_user_name || 'Unassigned')
            },
            { label: 'Assigned Email', value: 'assigned_user_email' },
            { label: 'Start Date', value: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString() : '' },
            { label: 'End Date', value: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString() : '' },
            { label: 'Duration (days)', value: 'duration' },
            { label: 'Progress (%)', value: (row) => Math.round(row.progress * 100) },
            { label: 'Created By', value: 'created_user_name' },
            { label: 'Created At', value: (row) => new Date(row.created_at).toLocaleString() },
            { label: 'Subtasks', value: 'subtask_count' },
            { label: 'Dependencies', value: 'dependency_count' },
        ];
        const csv = (0, json2csv_1.parse)(tasks, { fields });
        return csv;
    }
    // Export to PDF with modern design
    static async exportToPDF(projectId, userId) {
        const tasks = await this.getTasksForExport(projectId, userId);
        const project = await this.getProjectDetails(projectId);
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                margin: 50,
                size: 'A4',
                bufferPages: true,
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            // Modern color palette
            const colors = {
                primary: '#6366F1', // Indigo
                success: '#10B981', // Green
                warning: '#F59E0B', // Amber
                danger: '#EF4444', // Red
                info: '#3B82F6', // Blue
                gray: '#6B7280',
                lightGray: '#F3F4F6',
                darkGray: '#374151',
            };
            // Calculate statistics
            const stats = {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                inProgress: tasks.filter(t => t.status === 'in_progress').length,
                blocked: tasks.filter(t => t.status === 'blocked').length,
                avgProgress: tasks.length > 0
                    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length * 100)
                    : 0,
                critical: tasks.filter(t => t.priority === 'critical').length,
                high: tasks.filter(t => t.priority === 'high').length,
            };
            // Header with gradient-like effect
            doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
            doc.fillColor('white')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text(project.name, 50, 30, { align: 'center' });
            doc.fontSize(12)
                .font('Helvetica')
                .text('Project Task Report', 50, 65, { align: 'center' });
            doc.fontSize(10)
                .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 85, { align: 'center' });
            // Project status badge
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text(`Status: ${project.status.toUpperCase()}`, 50, 100, { align: 'center' });
            doc.moveDown(3);
            // Summary Statistics Cards
            const cardY = 140;
            const cardWidth = 120;
            const cardHeight = 70;
            const cardSpacing = 15;
            const startX = (doc.page.width - (cardWidth * 4 + cardSpacing * 3)) / 2;
            // Total Tasks Card
            doc.rect(startX, cardY, cardWidth, cardHeight)
                .fillAndStroke(colors.lightGray, colors.gray)
                .lineWidth(1);
            doc.fillColor(colors.darkGray)
                .fontSize(10)
                .font('Helvetica')
                .text('Total Tasks', startX, cardY + 10, { width: cardWidth, align: 'center' });
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(stats.total.toString(), startX, cardY + 30, { width: cardWidth, align: 'center' });
            // Completed Card
            doc.rect(startX + cardWidth + cardSpacing, cardY, cardWidth, cardHeight)
                .fillAndStroke('#D1FAE5', colors.success)
                .lineWidth(1);
            doc.fillColor(colors.success)
                .fontSize(10)
                .font('Helvetica')
                .text('Completed', startX + cardWidth + cardSpacing, cardY + 10, { width: cardWidth, align: 'center' });
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(stats.completed.toString(), startX + cardWidth + cardSpacing, cardY + 30, { width: cardWidth, align: 'center' });
            // In Progress Card
            doc.rect(startX + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight)
                .fillAndStroke('#DBEAFE', colors.info)
                .lineWidth(1);
            doc.fillColor(colors.info)
                .fontSize(10)
                .font('Helvetica')
                .text('In Progress', startX + (cardWidth + cardSpacing) * 2, cardY + 10, { width: cardWidth, align: 'center' });
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(stats.inProgress.toString(), startX + (cardWidth + cardSpacing) * 2, cardY + 30, { width: cardWidth, align: 'center' });
            // Avg Progress Card
            doc.rect(startX + (cardWidth + cardSpacing) * 3, cardY, cardWidth, cardHeight)
                .fillAndStroke(colors.lightGray, colors.gray)
                .lineWidth(1);
            doc.fillColor(colors.darkGray)
                .fontSize(10)
                .font('Helvetica')
                .text('Avg Progress', startX + (cardWidth + cardSpacing) * 3, cardY + 10, { width: cardWidth, align: 'center' });
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(`${stats.avgProgress}%`, startX + (cardWidth + cardSpacing) * 3, cardY + 30, { width: cardWidth, align: 'center' });
            doc.y = cardY + cardHeight + 30;
            // Tasks section header
            doc.fillColor(colors.darkGray)
                .fontSize(18)
                .font('Helvetica-Bold')
                .text('Task Details', 50, doc.y);
            doc.moveTo(50, doc.y + 5)
                .lineTo(doc.page.width - 50, doc.y + 5)
                .strokeColor(colors.primary)
                .lineWidth(2)
                .stroke();
            doc.moveDown(2);
            // Tasks list
            tasks.forEach((task, index) => {
                // Check if we need a new page
                if (doc.y > doc.page.height - 150) {
                    doc.addPage();
                    doc.y = 50;
                }
                const taskY = doc.y;
                // Task card background - skip drawing since height is dynamic
                // Task number and title
                doc.fillColor(colors.primary)
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text(`${index + 1}. ${task.title}`, 60, taskY + 10, { width: doc.page.width - 120 });
                doc.moveDown(0.3);
                // Description
                if (task.description) {
                    doc.fillColor(colors.darkGray)
                        .fontSize(9)
                        .font('Helvetica')
                        .text(task.description, 60, doc.y, { width: doc.page.width - 120 });
                    doc.moveDown(0.5);
                }
                // Status and Priority badges
                const badgeY = doc.y;
                let statusColor = colors.gray;
                switch (task.status) {
                    case 'completed':
                        statusColor = colors.success;
                        break;
                    case 'in_progress':
                        statusColor = colors.info;
                        break;
                    case 'blocked':
                        statusColor = colors.danger;
                        break;
                }
                doc.roundedRect(60, badgeY, 80, 16, 3)
                    .fillAndStroke(statusColor, statusColor)
                    .fillOpacity(0.2)
                    .fill();
                doc.fillOpacity(1)
                    .fillColor(statusColor)
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(task.status.replace(/_/g, ' ').toUpperCase(), 60, badgeY + 4, { width: 80, align: 'center' });
                let priorityColor = colors.gray;
                switch (task.priority) {
                    case 'critical':
                        priorityColor = colors.danger;
                        break;
                    case 'high':
                        priorityColor = colors.warning;
                        break;
                    case 'medium':
                        priorityColor = colors.info;
                        break;
                }
                doc.roundedRect(145, badgeY, 70, 16, 3)
                    .fillAndStroke(priorityColor, priorityColor)
                    .fillOpacity(0.2)
                    .fill();
                doc.fillOpacity(1)
                    .fillColor(priorityColor)
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(task.priority.toUpperCase(), 145, badgeY + 4, { width: 70, align: 'center' });
                doc.y = badgeY + 20;
                // Task details
                doc.fillColor(colors.darkGray)
                    .fontSize(9)
                    .font('Helvetica');
                const detailsY = doc.y;
                const assignedTo = task.assigned_group_name
                    ? `${task.assigned_group_name} (Group)`
                    : (task.assigned_user_name || 'Unassigned');
                doc.text(`Assigned: ${assignedTo}`, 60, detailsY);
                if (task.start_date || task.end_date) {
                    const start = task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A';
                    const end = task.end_date ? new Date(task.end_date).toLocaleDateString() : 'N/A';
                    doc.text(`Timeline: ${start} → ${end}`, 60, detailsY + 12);
                }
                // Progress bar
                const progressY = doc.y + 12;
                const progressBarWidth = 100;
                const progressValue = Math.round(task.progress * 100);
                doc.text(`Progress: ${progressValue}%`, 60, progressY);
                // Progress bar background
                doc.rect(160, progressY, progressBarWidth, 10)
                    .fillAndStroke(colors.lightGray, colors.gray)
                    .lineWidth(0.5);
                // Progress bar fill
                if (progressValue > 0) {
                    let progressColor = colors.danger;
                    if (progressValue >= 75)
                        progressColor = colors.success;
                    else if (progressValue >= 50)
                        progressColor = colors.info;
                    else if (progressValue >= 25)
                        progressColor = colors.warning;
                    doc.rect(160, progressY, (progressBarWidth * progressValue) / 100, 10)
                        .fill(progressColor);
                }
                doc.y = progressY + 15;
                if (task.subtask_count > 0 || task.dependency_count > 0) {
                    doc.fillColor(colors.gray)
                        .fontSize(8)
                        .text(`Subtasks: ${task.subtask_count} | Dependencies: ${task.dependency_count}`, 60, doc.y);
                }
                doc.moveDown(1.5);
            });
            // Add page numbers and footer
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                // Footer line
                doc.moveTo(50, doc.page.height - 70)
                    .lineTo(doc.page.width - 50, doc.page.height - 70)
                    .strokeColor(colors.lightGray)
                    .lineWidth(1)
                    .stroke();
                // Page number
                doc.fillColor(colors.gray)
                    .fontSize(9)
                    .font('Helvetica')
                    .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });
                // Branding
                doc.fontSize(8)
                    .text('Generated by Project Manager', 50, doc.page.height - 35, { align: 'center', width: doc.page.width - 100 });
            }
            doc.end();
        });
    }
    // Export to Google Sheets compatible format (optimized Excel)
    static async exportToGoogleSheets(projectId, userId) {
        const tasks = await this.getTasksForExport(projectId, userId);
        const project = await this.getProjectDetails(projectId);
        const workbook = new exceljs_1.default.Workbook();
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
            const assignedTo = task.assigned_group_name
                ? `${task.assigned_group_name} (Group)`
                : (task.assigned_user_name || 'Unassigned');
            const row = worksheet.addRow([
                task.id,
                task.title,
                task.description || '',
                task.status,
                task.priority,
                assignedTo,
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
            if (!column || !column.eachCell)
                return;
            let maxLength = headers[index]?.length || 10;
            column.eachCell({ includeEmpty: false }, (cell) => {
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
        return buffer;
    }
}
exports.default = ExportService;
//# sourceMappingURL=export.service.js.map