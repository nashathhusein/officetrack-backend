const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {
  initializeApp,
  cert,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const nodemailer = require("nodemailer");

dotenv.config();

const serviceAccount = require("./serviceAccountKey.json");


// ===============================
// FIREBASE ADMIN
// ===============================

initializeApp({
  credential: cert(serviceAccount),
});


// ===============================
// EXPRESS APP
// ===============================

const app = express();


// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);


// ===============================
// JSON
// ===============================

app.use(express.json());


// ===============================
// SMTP
// ===============================

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,

  port: Number(process.env.MAIL_PORT),

  secure: false,

  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },

  tls: {
    rejectUnauthorized: true,
  },
});


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OfficeTrack Backend + Firebase Admin is running",
  });
});


// ===============================
// TEST SMTP
// ===============================

app.get("/test-smtp", async (req, res) => {
  try {
    await transporter.verify();

    res.json({
      success: true,
      message: "SMTP connection successful",
    });
  } catch (error) {
    console.error("SMTP Error:", error);

    res.status(500).json({
      success: false,
      message: "SMTP connection failed",
      error: error.message,
    });
  }
});


// ===============================
// TEST EMAIL
// ===============================

app.get("/test-email", async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from:
        `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,

      to: process.env.MAIL_USERNAME,

      subject: "OfficeTrack Test Email",

      text: "OfficeTrack email test successful.",

      html: `
        <div style="font-family: Arial, sans-serif;">

          <h2>OfficeTrack</h2>

          <p>
            This is a test email from the OfficeTrack backend.
          </p>

          <p>
            SMTP email sending is working successfully.
          </p>

        </div>
      `,
    });

    console.log(
      "Test email sent:",
      info.messageId
    );

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
    });

  } catch (error) {

    console.error(
      "Email Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Test email failed",
      error: error.message,
    });
  }
});


// ===============================
// REAL FIREBASE VERIFICATION EMAIL
// ===============================

app.post("/send-verification", async (req, res) => {

  try {

    const email = req.body.email;


    // ===============================
    // CHECK EMAIL
    // ===============================

    if (!email) {

      return res.status(400).json({
        success: false,
        message: "Email is required",
      });

    }


    // ===============================
    // GENERATE FIREBASE
    // VERIFICATION LINK
    // ===============================

    const verificationLink =
      await getAuth().generateEmailVerificationLink(
        email,
        {
          url: "https://nashath-flutter-app.web.app",
          handleCodeInApp: false,
        }
      );


    // ===============================
    // SEND EMAIL THROUGH GMAIL SMTP
    // ===============================

    const info = await transporter.sendMail({

      from:
        `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,

      to: email,

      subject: "Verify your OfficeTrack account",

      text: `
Welcome to OfficeTrack!

Please verify your email address by opening this link:

${verificationLink}

If you did not create an OfficeTrack account, you can ignore this email.
`,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #f5f7fa;
          "
        >

          <!-- HEADER -->

          <div
            style="
              background: #1e3a8a;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            "
          >

            <h1>
              OfficeTrack
            </h1>

            <p>
              Employee Attendance System
            </p>

          </div>


          <!-- BODY -->

          <div
            style="
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            "
          >

            <h2>
              Verify Your Email
            </h2>


            <p>
              Welcome to OfficeTrack.
            </p>


            <p>
              Please verify your email address to activate your
              OfficeTrack account.
            </p>


            <!-- VERIFY BUTTON -->

            <div
              style="
                text-align: center;
                margin: 30px 0;
              "
            >

              <a
                href="${verificationLink}"
                style="
                  display: inline-block;
                  background: #2563eb;
                  color: white;
                  text-decoration: none;
                  padding: 14px 28px;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                VERIFY EMAIL
              </a>

            </div>


            <p
              style="
                font-size: 13px;
                color: #666;
              "
            >
              If the button does not work, copy and open the
              verification link from the email.
            </p>


            <hr>


            <p
              style="
                font-size: 12px;
                color: #777;
                text-align: center;
              "
            >
              OfficeTrack<br>
              Employee Attendance System
            </p>

          </div>

        </div>
      `,
    });


    // ===============================
    // SUCCESS LOG
    // ===============================

    console.log(
      "Verification email sent:",
      info.messageId
    );


    // ===============================
    // RESPONSE
    // ===============================

    res.json({

      success: true,

      message:
        "Verification email sent successfully",

    });


  } catch (error) {

    // ===============================
    // ERROR
    // ===============================

    console.error(
      "Verification Email Error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to send verification email",

      error:
        error.message,

    });

  }

});


// ===============================
// START SERVER
// ===============================

const PORT =
  process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `OfficeTrack Backend running on port ${PORT}`
  );

  console.log(
    "Firebase Admin connected successfully"
  );

});