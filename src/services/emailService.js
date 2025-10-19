const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Create AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION, // e.g. "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});


const sendSubscriptionPurchaseEmail = async (email, username) => {
  try {
    const firstName = username || 'Cher utilisateur';
    const activateUrl = 'https://www.app.ecosysteme.ai/';

    const params = {
      Source: process.env.EMAIL_USER,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: '👋 Active ton compte sur Ecosysteme.ai',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Activation de compte - Ecosysteme.ai</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:24px;box-sizing:border-box;">
    <!-- Header -->
    <div style="text-align:center;padding:24px 12px;background-color:#f0f0ff;border-radius:8px;">
      <img alt="Ecosysteme.ai" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png" style="width:160px;height:auto;display:block;margin:0 auto;" />
    </div>

    <!-- Main -->
    <div style="background:#ffffff;padding:32px;border-radius:8px;margin-top:18px;color:#0b0b0b;">
      <h1 style="font-size:22px;margin:0 0 12px;font-weight:600;">Salut ${firstName},</h1>

      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">
        Bienvenue à bord ! 🚀
      </p>

      <p style="font-size:16px;line-height:1.5;margin:0 0 20px;">
        Pour activer ton compte, tu vas d’abord recevoir un code de vérification par e-mail.<br/>
        Entre ce code lorsque c’est demandé, puis crée ton mot de passe pour finaliser ton accès.
      </p>

      <!-- Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${activateUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;background-color:#675FFF;color:#ffffff;">
          👉 Activer mon compte
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="font-size:14px;line-height:1.4;margin:8px 0 18px;color:#333;">
        Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :
      </p>

      <div style="background:#f4f6ff;padding:12px;border-radius:8px;word-break:break-all;margin-bottom:18px;font-weight:600;color:#675FFF;">
        <a href="${activateUrl}" style="color:#675FFF;text-decoration:none;">${activateUrl}</a>
      </div>

      <p style="font-size:16px;line-height:1.5;margin-top:28px;">
        À tout de suite,<br/>
        <strong>Sami</strong>
      </p>
    </div>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;background-color:#6366f1;color:#fff;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:18px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png" alt="Logo" style="width:44px;height:44px;display:block;">
            <div style="font-weight:600;font-size:18px;">Ecosysteme.ai</div>
          </div>

          <div style="margin-top:14px;">
            <a href="#" style="margin-right:10px;display:inline-block;background:rgba(255,255,255,0.15);padding:8px;border-radius:50%;text-decoration:none;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/whatsapp_cnfbrz.png" alt="WhatsApp" style="width:14px;height:14px;">
            </a>
            <a href="#" style="margin-right:10px;display:inline-block;background:rgba(255,255,255,0.15);padding:8px;border-radius:50%;text-decoration:none;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/facebook_jmmlqy.png" alt="Facebook" style="width:14px;height:14px;">
            </a>
            <a href="#" style="display:inline-block;background:rgba(255,255,255,0.15);padding:8px;border-radius:50%;text-decoration:none;">
              <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/instagram_ebofvs.png" alt="Instagram" style="width:14px;height:14px;">
            </a>
          </div>

          <hr style="border:none;height:1px;background-color:rgba(255,255,255,0.12);margin:18px 0;">

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div>Copyright © 2025 All Rights Reserved</div>
            <div>
              <a href="${process.env.FRONTEND_URL}/terms-conditions" style="color:#ffffff;text-decoration:none;margin-right:8px;">Terms & Conditions</a>
              <span style="color:rgba(255,255,255,0.6);margin:0 8px;">|</span>
              <a href="${process.env.FRONTEND_URL}/privacy-policy" style="color:#ffffff;text-decoration:none;">Privacy Policy</a>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error sending subscription activation email:', error);
    return false;
  }
};


const sendOTPEmail = async (email, otp) => {
  try {
    const params = {
      Source: process.env.EMAIL_USER, 
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Your OTP for Profile Activation',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ecosysteme.ai Login Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0ff; font-family: sans-serif;">
  <div style="width: 100%; margin: 0 auto; box-sizing: border-box;">
    <div style="width: 95%; padding: 30px 20px; background-color: rgb(235, 227, 227); text-align: center;">
      <img style="width:250px;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_10_ciof8p.png"/>
    </div>
    <div style="padding: 40px 20px;">
      <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/image_czg2wu.png" alt="Password Field" style="width: 100px; height: auto;">
      <h1 style="font-size: 24px; margin: 20px 0 10px;">You requested to login Ecosysteme.ai.</h1>
      <p style="font-size: 16px;">Use this below 4 digit code to login</p>
      <div style="font-weight: 600; color: #675FFF; font-size: 14px; background-color:rgb(252,252,252);padding:10px;border-radius:10px;">
        ${otp}
      </div>
      <p style="color: #ef4444; font-size: 14px; margin: 30px 0;">*This otp will expire in 1 hour.</p>
      <p style="font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #6366f1; color: white;">
      <tr>
        <td style="padding: 0; width:100%">
          <div style="display:flex; justify-content:space-between;">
            <div style="margin-left:20px; width: 100%;">
              <div style="margin-bottom: 30px; padding:20px 0 0 0;">
                <img style="width: 50px; height: 50px;" alt="Logo" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/logo_lxvyxp.png"/>
                <span style="font-weight: 600; color: white; font-size: 1.75rem; margin-left: 10px;">Ecosysteme.ai</span>
              </div>
              <div style="margin: 20px 0 30px;">
                <a href="#" style="margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/whatsapp_cnfbrz.png" alt="WhatsApp" style="width: 16px; height: 16px;">
                </a>
                <a href="#" style="margin-right: 15px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/facebook_jmmlqy.png" alt="Facebook" style="width: 16px; height: 16px;">
                </a>
                <a href="#" style="background: rgba(255,255,255,0.2); border-radius: 50%; padding: 10px;">
                  <img src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/instagram_ebofvs.png" alt="Instagram" style="width: 16px; height: 16px;">
                </a>
              </div>
            </div>
            <img style="display: block; width: 150px; height:150px;" src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/footerImage_ys0mlm.png" alt="Footer decoration"/>
          </div>
          <hr style="border: none; height:1px; background-color:#7B77E4; margin: 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
            <tr>
              <td align="left" style="font-size:14px; color:white;padding-left:10px;">Copyright © 2025 All Rights Reserved</td>
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
</html>`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};


// RESET PASSWORD EMAIL

const sendResetPasswordEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const params = {
      Source: process.env.EMAIL_USER,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Reset Your Password',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `<!DOCTYPE html>
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
      
      <!-- Reset Link -->
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
              src="https://ecosystem-ai.s3.eu-north-1.amazonaws.com/assests/footerImage_ys0mlm.png"
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
      </tr>
    </table>
  </div>
</body>
</html>`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

// INVITATION EMAIL

const sendInvitationEmail = async (email, token, adminName) => {
  try {
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    const params = {
      Source: process.env.EMAIL_USER,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'You\'re Invited to Join Ecosysteme.ai',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `<!DOCTYPE html>
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
      <p style="font-size: 16px; margin: 0 0 20px; color: #000; font-weight: normal;">You've been invited to join the platform by <b>${adminName}</b>.</p>
      <p style="font-size: 16px; margin: 0 0 30px; color: #000;">Click the button below to accept your invitation:</p>
      
      <!-- Button -->
      <div style="margin: 20px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 5px;">
          Accept Invitation
        </a>
      </div>

      <!-- Fallback Link -->
      <p style="font-size: 14px; margin: 20px 0; color: #000;">If the button doesn't work, copy and paste this link into your browser:</p>
      <div style="flex: 1; font-weight: 600; color: #675FFF; font-size: 14px; background-color:white; padding:10px; border-radius:10px; word-break: break-all;">
        <a href="${inviteUrl}" style="color:#675FFF; text-decoration:none;">${inviteUrl}</a>
      </div>

      <!-- Expiration Warning -->
      <p style="color: #ef4444; font-size: 14px; margin: 30px 0;">*This invitation link will expire in 1 hour.</p>

      <!-- Security Notice -->
      <p style="color: #000; font-size: 14px; margin: 40px 0 0;">If you weren't expecting this email, you can safely ignore it.</p>
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
</html>`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendResetPasswordEmail,
  sendInvitationEmail,
  sendSubscriptionPurchaseEmail
};
