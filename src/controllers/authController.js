const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { sendOTPEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');


  // Check user existence and profile activation status
  exports.checkUserProfile = async (req, res) => {
    try {
      const { email } = req.body;
      console.log(email);
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          profilePresent: false,
          profileActivated: false,
          message: 'User not found'
        });
      }

      // If profile is not active, send OTP
      if (!user.activeProfile) {
        const otp = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
          return res.status(500).json({ message: 'Error sending OTP email' });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { otp }
        });

        return res.status(200).json({
          profilePresent: true,
          profileActivated: false,
          message: 'OTP sent to your email',
          userId: user.id
        });
      }

      return res.status(200).json({
        profilePresent: true,
        profileActivated: true,
        message: 'Profile is active',
        userId: user.id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error checking user profile' });
    }
  },

  // Login controller - only checks credentials
  exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { userId: user.id ,userEmail:user.email},
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const refreshToken=jwt.sign(
        {userId:user.id,userEamil:user.email},
        process.env.JWT_SECRET,
        {
          expiresIn:'30d'
        }
      );

      await prisma.user.update({
        where:{
            email
        },
        data:{
          refreshToken
        }
      })

    //  res.cookie("accessToken",accessToken,{
    //   httpOnly:true,
    //   maxAge: 86400000 // 1 day
    //  })

    //  res.cookie("refreshToken",refreshToken,{
    //   httpOnly:true,
    //   maxAge:2592000000 // 30 days
    //  })

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          activeProfile: user.activeProfile
        }
        ,accessToken,
        refreshToken
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error logging in' });
    }
  },

  // Verify OTP and activate profile
  exports.verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.otp !== otp) {
        return res.status(401).json({ message: 'Invalid OTP' });
      }

      await prisma.user.update({
        where: {  email },
        data: {
          otp: null
        }
      });

      res.json({
        message: 'Profile activated successfully',
        profileActivated: true
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error verifying OTP' });
    }
  },

  // Set password controller
  exports.setPassword = async (req, res) => {
    try {


      const { email, newPassword } = req.body;
      if(!email||!newPassword){     
       return res.status(401).json({
        message:"Resources are missing"
       })
     }
   

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword ,
          activeProfile:true
        }
      });


      res.json({
        message: 'Password set successfully',
        user
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error setting password' });
    }
  },

  // Google login controller
  exports.googleLogin = async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ message: 'Google access token is required' });
      }

      // Fetch user info using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        return res.status(401).json({ message: 'Invalid access token' });
      }

      const userInfo = await response.json();
      const { email, sub: googleId } = userInfo;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          message: 'User not found Please signup first',
          email
        });
      }

      let token;
      if(user.activeProfile){
        const accessToken = jwt.sign(
          { userId: user.id ,userEmail:user.email},
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
  
        const refreshToken=jwt.sign(
          {userId:user.id,userEamil:user.email},
          process.env.JWT_SECRET,
          {
            expiresIn:'30d'
          }
        ); 
        await prisma.user.update({
          where:{
              email
          },
          data:{
            refreshToken
          }
        })

      //  res.cookie("accessToken",accessToken,{
      //   httpOnly:true,
      //   maxAge: 86400000 // 1 day
      //  })
  
      //  res.cookie("refreshToken",refreshToken,{
      //   httpOnly:true,
      //   maxAge:2592000000 // 30 days
      //  })  
        return res.json({
          message: 'Login successful',
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileActivated: user.activeProfile
          
          ,accessToken,
          refreshToken
        });
      }
    

      // If user exists, check profile activation status
      return res.status(200).json({
        profilePresent: true,
        profileActivated: user.activeProfile,
        message: user.activeProfile,
        userId: user.id,
        email
      });

    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ message: 'Error during Google login' });
    }
  }

  exports.refreshAccessToken=async (req,res)=>{
     try{
     const {token}=req.body;

      if(!token){
      return  res.json({
          success:false,
          message:"refreshToken is required"
        });
      }

      let decoded;
      try{
       decoded=jwt.verify(token,process.env.JWT_SECRET);

      }catch(error){
      console.log("Error",error.message);
      return res.status(401).json({
      success:false,
      message:"Token is expired"
    });
  }

     const user=await prisma.user.findUnique({where:{id:decoded.userId }});

     if(!user){
      return res.status(401).json({
        success:false,
        message:"User not found"
      });
     }

     if(user.refreshToken!=token){

      return res.status(401).json({
        success:false,
        message:"Not valid refresh token"
      })
     }
      
      
      const accessToken=jwt.sign({userId:user.id,userEmail:user.email},process.env.JWT_SECRET,{expiresIn:"1d"});



      // res.cookie("accessToken",accessToken,{
      //   httpOnly:true,
      //   maxAge:86400000
      // });
    
       return res.status(200).json({
            success:true,
            message:"Token generated successfully",
            accessToken

       });

     }catch(error){
      console.log("Error",error.message);
     return res.status(500).json({     
          success:false,
          message:"Internal server error"
        });
     }
  }


  exports.logOut=async(req,res)=>{
    try{

      const userId=req.userId;
      //  res.clearCookie("refreshToken",{
      //   httpOnly:true,
      //   sameSite:'Strict'
      //  });
      //  res.clearCookie("accessToken",{
      //   httpOnly:true,
      //   sameSite:'Strict'
      //  })

      //  res.status(200).json({
      //   success:true,
      //   message:"Logged out successfully"
      //  })

      await prisma.user.update({where:{
            id:userId
      },
      data:{
        refreshToken:null
      }
    });

    return res.status(200).json({
     success:true,
     message:"Logout successfully "
    });

    }catch(error){
      console.log("error",error.message)
      res.json({
        success:false,
        message:error.message
      })
    }
  }
  