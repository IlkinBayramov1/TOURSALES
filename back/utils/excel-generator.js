import ExcelJS from 'exceljs';

/**
 * Generates an Excel file buffer using exceljs
 * @param {Array} data - Array of objects containing row data
 * @param {Array} columns - Array of objects defining headers and keys [{ header: 'Name', key: 'name', width: 20 }]
 * @param {string} sheetName - Name of the worksheet
 * @returns {Promise<Buffer>} - Excel file buffer
 */
export const generateExcel = async (data, columns, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;

  // Başlıq sətirinin dizaynı (Tünd göy rəngdə, ağ rəngli qalın şriftlə)
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F497D' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 25;

  // Məlumat sətirlərinin əlavə edilməsi
  data.forEach((item) => {
    worksheet.addRow(item);
  });

  // Məlumat şriftləri və sətir hündürlüklərinin nizamlanması
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      row.height = 20;
    }
  });

  // Buffer olaraq geri qaytarılması (Yaddaşda limitsiz böyümənin qarşısını almaq üçün)
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default {
  generateExcel
};
