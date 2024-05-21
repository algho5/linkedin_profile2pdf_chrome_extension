document
  .getElementById("scrapeButton")
  .addEventListener("click", scrapeProfile);
function generatePDFFromJSON(resumeData) {
  // Create a new PDF document
  const doc = new PDFDocument();

  // Create an array to store chunks of the PDF
  const chunks = [];

  // Handle each chunk of the PDF
  doc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  // Handle end of PDF generation
  doc.on("end", () => {
    // Combine all chunks into a single Blob
    const blob = new Blob(chunks, { type: "application/pdf" });

    // Create a download link for the Blob
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${resumeData.profile.name}.pdf`;

    // Append the link to the document and trigger a click event to start the download
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link from the document
    document.body.removeChild(link);
  });
  // Add content to the PDF
  doc.fontSize(20).text(resumeData.profile.name);
  doc.fontSize(12).text(resumeData.profile.summary);
  doc.text(resumeData.profile.email);
  doc.text(resumeData.profile.phone);
  doc.text(resumeData.profile.location);
  doc.moveDown();
  // Work Experiences
  doc.fontSize(18).text("WORK EXPERIENCE");
  resumeData.workExperiences.forEach((exp, index) => {
    if (index > 0) doc.moveDown(); // Add space between work experiences
    doc.fontSize(14).text(exp.company);
    doc.fontSize(14).text(exp.jobTitle);
    doc.fontSize(14).text(`(${exp.date})`);
    exp.descriptions.forEach((desc) => doc.text(desc));
  });

  // Educations
  doc.fontSize(18).text("EDUCATION");
  resumeData.educations.forEach((edu) => {
    doc.fontSize(14).text(`${edu.school}`);
  });

  // Projects
  doc.fontSize(18).text("PROJECTS");
  resumeData.projects.forEach((project) => {
    doc.fontSize(14).text(`${project.name}`);
  });

  // Skills
  doc.fontSize(18).text("SKILLS");
  doc.fontSize(14).text(resumeData.skills.descriptions);

  // Finalize the PDF document
  doc.end();
}

async function scrapeProfile() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const pdfDoc = await PDFLib.PDFDocument.create();

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: scrapeProfileData,
    })
    .then((res) => {
      const profile = res[0].result;
      console.log(profile);

      generatePDFFromJSON(profile);
    });
}

async function scrapeProfileData() {
  // Scrape profile name
  const profileNameElement = document.querySelector("h1.text-heading-xlarge");
  const profileName = profileNameElement
    ? profileNameElement.textContent.trim()
    : "";

  // Scrape profile summary
  const profileSummaryElement = document.querySelector(".text-body-medium");
  const profileSummary = profileSummaryElement
    ? profileSummaryElement.textContent.trim()
    : "";

  // Scrape profile email
  const profileEmailElement = document.querySelector(
    'a[aria-label="See email address"]'
  );
  const profileEmail = profileEmailElement
    ? profileEmailElement.textContent.trim()
    : "";

  // Scrape profile phone
  const profilePhoneElement = document.querySelector(
    ".text-body-small.t-black--light"
  );
  const profilePhone = profilePhoneElement
    ? profilePhoneElement.textContent.trim()
    : "";

  // Scrape profile location
  const profileLocationElement = document.querySelector(
    ".text-body-small.inline.t-black--light.break-words"
  );
  const profileLocation = profileLocationElement
    ? profileLocationElement.textContent.trim()
    : "";

  // Scrape work experiences from the specified ul element
  const workExperienceItems = document.querySelectorAll(
    "ul.IrRcaBvIHeHKuFxTvPlGZIHHnhgghHPEzHM > li.artdeco-list__item"
  );
  const workExperiences = [];

  for (let i = 2; i < workExperienceItems.length && i < 5; i++) {
    const item = workExperienceItems[i];

    const titleElement = item.querySelector(
      'div.display-flex.align-items-center.mr1.t-bold > span[aria-hidden="true"]'
    );
    const jobTitle = titleElement ? titleElement.textContent.trim() : "";

    const companyElement = item.querySelector("span.t-14.t-normal");
    let company = companyElement ? companyElement.textContent.trim() : "";
    company = company.split("·")[0].trim();

    const durationElement = item.querySelector(
      "span.pvs-entity__caption-wrapper"
    );
    let date = durationElement ? durationElement.textContent.trim() : "";
    date = date.split("·")[0].trim();

    const responsibilitiesElement = item.querySelector(
      "div.VKmtFMbGcexXxGKFHtDnLrZdQSvxvnk.inline-show-more-text--is-collapsed.inline-show-more-text--is-collapsed-with-line-clamp.full-width span.visually-hidden"
    );
    const descriptions = responsibilitiesElement
      ? responsibilitiesElement.textContent
          .trim()
          .split("\n")
          .filter((desc) => desc.trim() !== "")
          .map((desc) => {
            // Ensure each description starts with "•"
            return "•" + desc.replace(/^-/, "").trim();
          })
      : [];

    workExperiences.push({
      company,
      jobTitle,
      date,
      descriptions,
    });
  }

  // Scrape education school names from the 2nd to the 7th item
  const educationItems = document.querySelectorAll(
    "ul.IrRcaBvIHeHKuFxTvPlGZIHHnhgghHPEzHM > li.artdeco-list__item"
  );
  const educations = [];

  for (let i = 2; i < educationItems.length && i < 10; i++) {
    const item = educationItems[i];
    const schoolElement = item.querySelector(
      'div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold > span[aria-hidden="true"]'
    );
    const school = schoolElement ? schoolElement.textContent.trim() : "";

    if (school) {
      educations.push({
        school,
        degree: "Bachelor of Science in Economics and Physics",
        date: "May 1997",
        gpa: "4.0",
        descriptions: [],
      });
    }
  }

  const skillItems = document.querySelectorAll(
    "ul.IrRcaBvIHeHKuFxTvPlGZIHHnhgghHPEzHM > li.artdeco-list__item"
  );
  const skillList = [];

  for (let i = 9; i < skillItems.length && i < 15; i++) {
    const item = skillItems[i];
    const skillElement = item.querySelector(
      'div.display-flex.align-items-center.mr1.hoverable-link-text.t-bold > span[aria-hidden="true"]'
    );
    const skill = skillElement ? skillElement.textContent.trim() : "";

    if (skill) {
      skillList.push(skill);
    }
  }

  const skills = {
    descriptions: skillList.join(", "),
  };

  // Construct JSON object
  const data = {
    profile: {
      name: profileName,
      summary: profileSummary,
      email: "test@gmail.com",
      phone: "000-000-0000",
      location: profileLocation,
      url: "linkedin.com/in/test",
    },
    workExperiences: workExperiences,
    educations: educations,
    projects: [],
    skills: skills,
  };

  return data;

  // Download as JSON
  /*  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "linkedin_profile.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);*/
}
