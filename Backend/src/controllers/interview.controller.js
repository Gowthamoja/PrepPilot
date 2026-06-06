const { PDFParse } = require("pdf-parse");
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

async function generateInterviewReportController(req, res) {
  try {
    let resumeText = "";

    if (req.file) {
      const parser = new PDFParse({
        data: req.file.buffer,
      });

      const resumeContent = await parser.getText();
      await parser.destroy();

      resumeText = resumeContent.text;
    }

    const { selfDescription, jobDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    console.log("Controller Log:", interviewReportByAi);

    console.log("Before Mongo Save");

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interviewReportByAi
    });

    console.log("Saved Successfully");

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    });

  } catch (error) {
    console.error("CONTROLLER ERROR:");
    console.error(error);

    return res.status(500).json({
      message: error.message,
      stack: error.stack
    });
  }
}

/**
 * @description Controller to get interview report by interviewId. 
 */

async function getInterviewReportController(req,res) {
  const {interviewId} = req.params;
  const user = req.user;
  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: user.id
  });

  if(!interviewReport) {
    return res.status(404).send({
      message: "Interview report not found"
    });
  }

  return res.status(200).send({
    message: "Interview report fetched successfully",
    interviewReport
  });

}

/**
 * @description Controller to get all interview reports of logged in user.
 */

async function getAllInterviewReportsController(req,res) {
  const user = req.user;
  const interviewReports = await interviewReportModel.find({
    user: user.id
  }).sort({createdAt: -1}).select('-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan');

  return res.status(200).json({
    message: "Interview reports fetched successfully",
    interviewReports
  });

}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */

async function generateResumePdfController(req, res) {
  const {interviewReportId} = req.params;
  const interviewReport = await interviewReportModel.findById(interviewReportId);

  if(!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found"
    });
  }

  const {resume, selfDescription, jobDescription} = interviewReport;

  const pdfBuffer = await generateResumePdf({resume, jobDescription, selfDescription});

  res.set({
    "Content-type": "application/pdf",
    "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
  });

  res.send(pdfBuffer);

}

module.exports = {
  generateInterviewReportController,
  getInterviewReportController,
  getAllInterviewReportsController,
  generateResumePdfController
};
