import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// PDF.js worker setup
try {
  // Try to use CDN first, fallback to local
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('PDF.js worker setup failed, using default');
}

export const parseJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const parseXLSX = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const questions = jsonData.map((row, index) => ({
          id: index + 1,
          question: row.question || row.Question || row['Savol'] || '',
          options: [
            row.optionA || row['A'] || row['Variant A'] || '',
            row.optionB || row['B'] || row['Variant B'] || '',
            row.optionC || row['C'] || row['Variant C'] || '',
            row.optionD || row['D'] || row['Variant D'] || '',
          ].filter(Boolean),
          answer: row.answer || row.Answer || row['Javob'] || 0,
        }));

        resolve({ title: sheetName, questions });
      } catch (error) {
        reject(new Error('Failed to parse XLSX file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const questions = results.data.map((row, index) => ({
            id: index + 1,
            question: row.question || row.Question || '',
            options: [
              row.optionA || row['A'] || '',
              row.optionB || row['B'] || '',
              row.optionC || row['C'] || '',
              row.optionD || row['D'] || '',
            ].filter(Boolean),
            answer: parseInt(row.answer || row.Answer || 0),
          }));
          resolve({ title: 'Imported Test', questions });
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      },
      error: (error) => reject(error),
    });
  });
};

export const parseTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      resolve({ text, paragraphs });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Parse PDF file
export const parsePDF = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const questions = [];
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      // Try to extract questions from text
      const questionRegex = /(?:Question\s*(\d+)|Q\s*(\d+)|(\d+)\.)\s*(.+?)(?=(?:Question\s*\d+|Q\s*\d+|\d+\.)|$)/gis;
      let match;
      
      while ((match = questionRegex.exec(fullText)) !== null) {
        const questionNum = match[1] || match[2] || match[3];
        const questionText = match[4].trim();
        
        // Try to extract options (A, B, C, D)
        const options = [];
        const optionRegex = /([A-D])[\.\)]\s*(.+?)(?=(?:[A-D][\.\)]|$))/gi;
        let optionMatch;
        
        while ((optionMatch = optionRegex.exec(questionText)) !== null) {
          options.push(optionMatch[2].trim());
        }
        
        questions.push({
          id: parseInt(questionNum),
          question: questionText,
          options: options.length > 0 ? options : [],
          answer: 0,
        });
      }
      
      const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
      
      resolve({ 
        text: fullText, 
        paragraphs,
        questions: questions.length > 0 ? questions : []
      });
    } catch (error) {
      reject(new Error('Failed to parse PDF file: ' + error.message));
    }
  });
};

// Parse Word (.docx) file
export const parseDOCX = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Extract questions
      const questions = [];
      const questionRegex = /(?:Question\s*(\d+)|Q\s*(\d+)|(\d+)\.)\s*(.+?)(?=(?:Question\s*\d+|Q\s*\d+|\d+\.)|$)/gis;
      let match;
      
      while ((match = questionRegex.exec(text)) !== null) {
        const questionNum = match[1] || match[2] || match[3];
        const questionText = match[4].trim();
        
        // Try to extract options (A, B, C, D)
        const options = [];
        const optionRegex = /([A-D])[\.\)]\s*(.+?)(?=(?:[A-D][\.\)]|$))/gi;
        let optionMatch;
        
        while ((optionMatch = optionRegex.exec(questionText)) !== null) {
          options.push(optionMatch[2].trim());
        }
        
        questions.push({
          id: parseInt(questionNum),
          question: questionText,
          options: options.length > 0 ? options : [],
          answer: 0,
        });
      }
      
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      
      resolve({ 
        text, 
        paragraphs,
        questions: questions.length > 0 ? questions : []
      });
    } catch (error) {
      reject(new Error('Failed to parse DOCX file: ' + error.message));
    }
  });
};

