const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Profile Activation',
      html: `       
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ecosysteme.ai Login Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0ff; font-family: sans-serif;">
  <div style="width: 100%; margin: 0 auto; box-sizing: border-box;">
    <!-- Header -->
    <div style="width: 95%; padding: 30px 20px; background-color: rgb(235, 227, 227); text-align: center; border-radius: 0;">
      <div style="display: inline-block; text-align: center;">
        <img style="width:250px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_10_ciof8p.png"/>
      </div>
    </div>

    <!-- Content Area -->
    <div style="padding: 40px 20px;">
      <!-- Password Field Icon -->
      <div style="margin-bottom: 10px;">
        <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_czg2wu.png" alt="Password Field" style="width: 100px; height: auto;">
      </div>

      <!-- Main Text -->
      <h1 style="font-size: 24px; margin: 20px 0 10px; font-weight: 600; color: #000;">You requested to login Ecosysteme.ai.</h1>
      <p style="font-size: 16px; margin: 0 0 30px; color: #000; font-weight: normal;">Use this below 4 digit code to login</p>
      
      <!-- OTP Code -->
      <div style="flex: 1; font-weight: 600; color: #675FFF; font-size: 14px; background-color:rgb(252,252,252);padding:10px;border-radius:10px;">
        ${otp}
      </div>
      
      <!-- Expiration Warning -->
      <p style="color: #ef4444; font-size: 14px; margin: 30px 0;">*This otp will expire in 1 hour.</p>
      
      <!-- Security Notice -->
      <p style="color: #000; font-size: 14px; margin: 40px 0 0;">If you didn't request this, please ignore this email.</p>
    </div>

    <!-- Footer - Using table layout for better email client compatibility -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #6366f1; color: white;">
      <tr>
        <td style="padding: 0; width:100% ">
          <!-- Logo in Footer -->
          
          <div style="display:flex; justify-content:space-between;">
        
          <div style="margin-left:20px; width: 100%;">
          <div style="margin-bottom: 30px; padding:20px 0 0 0;">
            <img style="width: 50px; height: 50px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png"/>
            <span style="font-weight: 600; color: white; font-size: 1.75rem; vertical-align: middle; margin-left: 10px;">
              Ecosysteme.ai
            </span>
          </div>
          
          <!-- Social Media Icons -->
          <div style="margin: 20px 0 30px;">
            <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/whatsapp_cnfbrz.png" alt="WhatsApp" style="width: 16px; height: 16px;">
            </a>
            <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/facebook_jmmlqy.png" alt="Facebook" style="width: 16px; height: 16px;">
            </a>
            <a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/instagram_ebofvs.png" alt="Instagram" style="width: 16px; height: 16px;">
            </a>
          </div>
          
          </div>
          
           <img 
            style="display: block; width: 150px; height:150px;"
            src=https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/footerImage_ys0mlm.png"
            alt="Footer decoration"
          />
          
          </div>
          
          <hr style="border: none; height:1px; background-color:#7B77E4; margin: 20px 0;">
          
          <!-- Copyright and Links -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
  <tr>
    <td align="left" style="font-size:14px; color:white;padding-left:10px;">
      Copyright © 2025 All Rights Reserved
    </td>
    <td align="right" style="font-size:14px; color:white;padding-right:10px;">
      <a href="${process.env.FRONTEND_URL}/terms-conditions" style="color: white; text-decoration: none; padding-right:5px;">Terms & Conditions</a>
      <span style="display: inline-block; width: 1px; height: 18px; background-color: #7B77E4;"></span>
      <a href="${process.env.FRONTEND_URL}/privacy-policy" style="color: white; text-decoration: none; padding-left:5px;">Privacy Policy</a>
    </td>
  </tr>
</table>

        </td>
        
        <!-- Footer Decoration Image in separate cell -->
        <td width="150" valign="top" style="padding: 0;">
         
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendResetPasswordEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `   
      
      
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ecosysteme.ai Login Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: sans-serif;">
  <div style="width: 100%; margin: 0 auto; box-sizing: border-box;">
    <!-- Header -->
    <div style="width: 95%; padding: 30px 20px; background-color: #f0f0ff; text-align: center; border-radius: 0;">
      <div style="display: inline-block; text-align: center;">
        <img style="width:250px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_10_ciof8p.png"/>
    
      </div>
    </div>

    <!-- Content Area -->
    <div style="padding: 40px 20px;">
      <!-- Password Field Icon -->
      <div style="margin-bottom: 10px;">
        <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_czg2wu.png" alt="Password Field" style="width: 100px; height: auto;">
      </div>

      <!-- Main Text -->
      <h1 style="font-size: 24px; margin: 20px 0 10px; font-weight: 600; color: #000;">You requested to reset your password.</h1>
      <p style="font-size: 16px; margin: 0 0 30px; color: #000; font-weight: normal;">Click this link to reset your password:</p>
      
      <!-- OTP Code -->
      <div style="flex: 1; font-weight: 600; color: #675FFF; font-size: 14px; background-color:white;padding:10px;border-radius:10px;">
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
      
      <!-- Expiration Warning -->
      <p style="color: #ef4444; font-size: 14px; margin: 30px 0;">*This link will expire in 1 hour.</p>
      
      <!-- Security Notice -->
      <p style="color: #000; font-size: 14px; margin: 40px 0 0;">If you didn't request this, please ignore this email.</p>
    </div>

    <!-- Footer - Using table layout for better email client compatibility -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #6366f1; color: white;">
      <tr>
        <td style="padding: 0; width:100% ">
          <!-- Logo in Footer -->
          
          <div style="display:flex; justify-content:space-between;">
        
          <div style="margin-left:20px; width: 100%;">
          <div style="margin-bottom: 30px; padding:20px 0 0 0;">
            <img style="width: 50px; height: 50px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png"/>
            <span style="font-weight: 600; color: white; font-size: 1.75rem; vertical-align: middle; margin-left: 10px;">
              Ecosysteme.ai
            </span>
          </div>
          
          <!-- Social Media Icons -->
          <div style="margin: 20px 0 30px;">
            <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/whatsapp_cnfbrz.png" alt="WhatsApp" style="width: 16px; height: 16px;">
            </a>
            <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/facebook_jmmlqy.png" alt="Facebook" style="width: 16px; height: 16px;">
            </a>
            <a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/instagram_ebofvs.png" alt="Instagram" style="width: 16px; height: 16px;">
            </a>
          </div>
          
          </div>
          
           <img 
            style="display: block; width: 150px; height:150px;"
            src=https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/footerImage_ys0mlm.png"
            alt="Footer decoration"
          />
          
          </div>
          
          <hr style="border: none; height:1px; background-color:#7B77E4; margin: 20px 0;">
          
          <!-- Copyright and Links -->
           <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
  <tr>
    <td align="left" style="font-size:14px; color:white;padding-left:10px;">
      Copyright © 2025 All Rights Reserved
    </td>
    <td align="right" style="font-size:14px; color:white;padding-right:10px;">
      <a href="${process.env.FRONTEND_URL}/terms-conditions" style="color: white; text-decoration: none; padding-right:5px;">Terms & Conditions</a>
      <span style="display: inline-block; width: 1px; height: 18px; background-color: #7B77E4;"></span>
      <a href="${process.env.FRONTEND_URL}/privacy-policy" style="color: white; text-decoration: none; padding-left:5px;">Privacy Policy</a>
    </td>
  </tr>
</table>
        </td>
        
        <!-- Footer Decoration Image in separate cell -->
        <td width="150" valign="top" style="padding: 0;">
         
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};


const sendInvitationEmail = async ( email,token,adminName) => {
  try {
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'You’re Invited to Join Ecosystem.ai',
      html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ecosysteme.ai Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: sans-serif;">
  <div style="width: 100%; margin: 0 auto; box-sizing: border-box;">
    <!-- Header -->
    <div style="width: 95%; padding: 30px 20px; background-color: #f0f0ff; text-align: center; border-radius: 0;">
      <div style="display: inline-block; text-align: center;">
        <img style="width:250px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_10_ciof8p.png"/>
      </div>
    </div>

    <!-- Content Area -->
    <div style="padding: 40px 20px;">
      <!-- Illustration Icon -->
      <div style="margin-bottom: 10px;">
        <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_czg2wu.png" alt="Invitation Icon" style="width: 100px; height: auto;">
      </div>

      <!-- Main Text -->
      <h1 style="font-size: 24px; margin: 20px 0 10px; font-weight: 600; color: #000;">Welcome to Ecosysteme.ai!</h1>
      <p style="font-size: 16px; margin: 0 0 20px; color: #000; font-weight: normal;">You’ve been invited to join the platform by <b>${adminName}</b>.</p>
      <p style="font-size: 16px; margin: 0 0 30px; color: #000;">Click the button below to accept your invitation:</p>
      
      <!-- Button -->
      <div style="margin: 20px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 5px;">
          Accept Invitation
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="font-size: 14px; margin: 20px 0; color: #000;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <div style="flex: 1; font-weight: 600; color: #675FFF; font-size: 14px; background-color:white; padding:10px; border-radius:10px; word-break: break-all;">
        <a href="${inviteUrl}" style="color:#675FFF; text-decoration:none;">${inviteUrl}</a>
      </div>

      <!-- Expiration Warning -->
      <p style="color: #ef4444; font-size: 14px; margin: 30px 0;">*This invitation link will expire in 1 hour.</p>

      <!-- Security Notice -->
      <p style="color: #000; font-size: 14px; margin: 40px 0 0;">If you weren’t expecting this email, you can safely ignore it.</p>
    </div>

    <!-- Footer - Using table layout for better email client compatibility -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #6366f1; color: white;">
      <tr>
        <td style="padding: 0; width:100% ">
          <!-- Footer Branding -->
          <div style="display:flex; justify-content:space-between;">
            <div style="margin-left:20px; width: 100%;">
              <div style="margin-bottom: 30px; padding:20px 0 0 0;">
                <img style="width: 50px; height: 50px; vertical-align: middle;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png"/>
                <span style="font-weight: 600; color: white; font-size: 1.75rem; vertical-align: middle; margin-left: 10px;">
                  Ecosysteme.ai
                </span>
              </div>
              
              <!-- Social Media Icons -->
              <div style="margin: 20px 0 30px;">
                <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/whatsapp_cnfbrz.png" alt="WhatsApp" style="width: 16px; height: 16px;">
                </a>
                <a href="#" style="display: inline-block; margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/facebook_jmmlqy.png" alt="Facebook" style="width: 16px; height: 16px;">
                </a>
                <a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px; line-height: 0;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/instagram_ebofvs.png" alt="Instagram" style="width: 16px; height: 16px;">
                </a>
              </div>
            </div>
            
            <!-- Footer Decoration -->
            <img 
              style="display: block; width: 150px; height:150px;"
              src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/footerImage_ys0mlm.png"
              alt="Footer decoration"
            />
          </div>
          
          <hr style="border: none; height:1px; background-color:#7B77E4; margin: 20px 0;">
          
          <!-- Copyright -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
            <tr>
              <td align="left" style="font-size:14px; color:white;padding-left:10px;">
                Copyright © 2025 All Rights Reserved
              </td>
              <td align="right" style="font-size:14px; color:white;padding-right:10px;">
                <a href="${process.env.FRONTEND_URL}/terms-conditions" style="color: white; text-decoration: none; padding-right:5px;">Terms & Conditions</a>
                <span style="display: inline-block; width: 1px; height: 18px; background-color: #7B77E4;"></span>
                <a href="${process.env.FRONTEND_URL}/privacy-policy" style="color: white; text-decoration: none; padding-left:5px;">Privacy Policy</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>

      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};


module.exports = {
  sendOTPEmail,
  sendResetPasswordEmail,
  sendInvitationEmail
}; 