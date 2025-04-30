const prisma = require('../lib/prisma');
const {v4:uuid}=require("uuid");
const {sendInvitationEmail}=require("../services/emailService");
  // Get user profile
  exports.getProfile= async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select:{
          firstName:true,
          lastName:true,
          company:true,
          email:true,
          country:true,
          city:true,
          image:true,
          phoneNumber:true,
          role:true,
          subscriptionType:true
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  },

  // Update user profile
  exports.updateProfile= async (req, res) => {
    try {
      const { firstName, lastName, city, country, company, image ,phoneNumber} = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          firstName,
          lastName,
          city,
          country,
          company,
          image,
          phoneNumber
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          country: true,
          image: true,
          company: true
        }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  }




 exports.inviteMember=async (req, res) =>{

  try{
  const { email,role } = req.body;
  const adminId = req.userId;

  const user=await prisma.user.findUnique({
    where:{
      email
    }
  })

  if(user){
    return res.status(400).json({
      success:false,
      message:"User already present "
    })
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });

  if (admin.subscriptionType === 'pro') {
    return res.status(403).json({ message: 'Pro plan cannot invite team members.' });
  }

  const memberCount = await prisma.teamMembers.count({ where: { adminId } });

  if (admin.subscriptionType === 'business' && memberCount >= 10) {
    return res.status(403).json({ message: 'Business plan allows max 5 members.' });
  }

  const token = uuid();
  const now=new Date();

  await prisma.teamInvite.create({ 
    data: {
      email,
      token,
      adminId,
      role,
      expiresAt:  new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // expire date 7days
    },
  });

 const status= await sendInvitationEmail(email,token);

 if(status){
  return  res.status(200).json({ message: 'Invite sent successfully.' });
 }

 return res.status(400).json({
  success:false,
  message:"Something went wrong"
 })


}catch(error){
  console.log("Error",error.message);
  return res.status(500).json({
    success:false,
    message:error.message
  })
}
}


exports.acceptInvitation = async (req,res) => {
  try {
    const {token}=req.body;
    console.log(token);
    const invitation = await prisma.teamInvite.findUnique({
      where: { token },
    });
    if (!invitation || invitation.expiresAt < new Date() || invitation.accepted) {
      throw new Error('Invalid or expired invitation token.');
    }
    
    const user = await prisma.user.create({ 
      data: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.teamInvite.update({
      where: { token },
      data: { accepted: true },
    });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error accepting invitation:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


