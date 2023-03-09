const nodemailer = require("nodemailer");

module.exports = async (email) => {
  console.log(email);
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vrushabh.imps@gmail.com",
        pass: "bzptbarhxmfwbloi",
      },
    });

    let info = await transporter.sendMail({
      from: "vrushabh.imps@gmail.com", // sender address
      to: email, // list of receivers
      subject: "register", // Subject line
      text: "register successful...!", // plain text body
    });
    // res.send(info);
  } catch {
    console.log("Not send email........!");
  }
};
