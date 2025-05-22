const prisma = require('../lib/prisma');
const {v4:uuid}=require("uuid");
const {sendInvitationEmail}=require("../services/emailService");
  // Get user profile
  exports.getProfile= async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select:{
          id:true,
          firstName:true,
          lastName:true,
          company:true,
          email:true,
          country:true,
          city:true,
          image:true,
          phoneNumber:true,
          role:true,
          subscriptionType:true,
          isProfileComplete:true
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
        const totalTeamMember=user.subscriptionType==="pro"?0:(user.subscriptionType==="team"?5:10);
      res.status(200).json({...user,totalTeamMember}); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  },

  // Update user profile
  exports.updateProfile= async (req, res) => {
    try {
      const { firstName, lastName, city, country, company, image ,phoneNumber} = req.body;

      let isProfileComplete=false;

       if(firstName && lastName && city && country && company && image && phoneNumber){
        isProfileComplete=true;
       }
      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          firstName,
          lastName,
          city,
          country,
          company,
          image,
          phoneNumber,
          isProfileComplete
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          country: true,
          image: true,
          company: true,
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

  if(admin.subscriptionType === 'team' && admin.numberOfTeamMembers>= 5){
    return res.status(403).json({ message: 'Team plan allows max 5 members.' });
  }


  if (admin.subscriptionType === 'business' && admin.numberOfTeamMembers>= 10) {
    return res.status(403).json({ message: 'Business plan allows max 10 members.' });
  }

  const team=await prisma.team.findFirst({where:{userId:adminId}});
  const token = uuid();
  const now=new Date();

  if(team){

  if(admin.subscriptionType==="team"&&team.numberOfTeamMembers===5){
    return res.status(400).json({
      success:false,
      message:"Team is full"
    })
  }else if(admin.subscriptionType==="business"&&team.numberOfTeamMembers===10){
    return res.status(400).json({
      success:false,
      message:"Team is full"
    })
  }

  // crate invitaion 
  await prisma.teamInvite.create({ 
    data: {
      email,
      token,
      userId:adminId,
      role,
      teamId:team.id,
      expiresAt:  new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // expire date 7days
    },
  });
  

}else{

  const teamId=uuid();

 const newTeam=await prisma.team.create({

  data:{
    userId:adminId,
    numberOfTeamMembers:1,
    id:teamId
  }

 })
   
 await prisma.teamInvite.create({ 
  data: {
    email,
    token,
    userId:adminId,
    role,
    teamId:newTeam.id,
    expiresAt:  new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // expire date 7days
  },
});

 await prisma.teammembers.create({
  data:{
    isAdmin:true,
    role:"Admin",
    teamId:newTeam.id,
    userId:adminId
  }
 })

  
}
 
 

 const status= await sendInvitationEmail(email,token,admin.firstName+" "+admin.lastName);

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

    const isUser=await prisma.user.findUnique({
      where:{
       email: invitation.email
      }
    });

    if(isUser){
      return res.status(400).json({
        success:false,
        message:"User already exist"
      })
    }

    const admin =await prisma.user.findUnique({where:{
      id:invitation.userId
    }})


    const team=await prisma.team.findUnique({
      where:{
        id:invitation.teamId
      }
    });

    if(!team){
      return res.status(400).json({
        success:false,
        message:"team not found"
      })
    } 




    if (admin.subscriptionType === 'pro') {
      return res.status(403).json({ message: 'Ask admin to update the plane pro plane not allow team member' });
    }
  
    if(admin.subscriptionType === 'team' && admin.numberOfTeamMembers>= 5){
      return res.status(403).json({ message: 'Team plan allows max 5 members.' });
    }
  
  
    if (admin.subscriptionType === 'business' && admin.numberOfTeamMembers>= 10) {
      return res.status(403).json({ message: 'Business plan allows max 10 members.' });
    }

      
    const user = await prisma.user.create({ 
      data: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    await prisma.team.update({
      where:{
        id:invitation.teamId
      },
      data:{
        numberOfTeamMembers:team.numberOfTeamMembers+1
      }
    })

    await prisma.teammembers.create({
      data:{
        userId:user.id,
        role:invitation.role,
        teamId:invitation.teamId,
        isAdmin:false
      }
    });

    // Mark invitation as accepted
    await prisma.teamInvite.update({
      where: { token },
      data: { accepted: true },
    });

    return res.status(200).json({ success: true, message:"Invitation accepted successfully" });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.getUserTransactions = async (req, res) => {
  try {
      const userId = req.userId; // Assuming user ID is available from auth middleware

      const transactions = await prisma.transactionHistory.findMany({
          where: {
              userId: userId
          },
          orderBy: {
              transactionDate: 'desc'
          }
      });

      res.json({
          success: true,
          data: transactions
      });
  } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching transactions',
          error: error.message
      });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    const userId = req.userId;



    const user=await prisma.user.findFirst({where:{
      id:userId
    }})

    if(!user){
      return res.status(400).json({
        success:false,
        message:"Something went wrong"
      })
    }

    // First verify if the user is an admin
    const team=await prisma.team.findFirst({
          where:{
            userId
          }
    })

    const teamSize=user.subscriptionType==="pro"?1:(user.subscriptionType==="team"?5:10
    )

    if(!team){
      return res.status(200).json({
        success:true,
        message:'No team found',
        data:{membersData:[],teamSize,teamMembers:0}
      })
    }

    // Get all team members with their details in a single query
    const teamMembers = await prisma.teammembers.findMany({
      where: {
         teamId:team.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

if(!teamMembers && teamMembers.length === 0){
  return res.json({
      success: false,
      message: "No team members found",
      data:{membersData:[],teamSize,teamMembers:teamSize}
    });
}

    // Transform the response to a cleaner format
    const membersData =await Promise.all( teamMembers.map(async (member) => {
      const memberData=await prisma.user.findUnique({
        where:{
          id:member.userId
        },
        select:{
          firstName:true, 
          lastName:true,
          email:true,
          role:true,
          createdAt:true,
          phoneNumber:true,
          company:true,
          country:true,
          city:true,
        }
      })
      return memberData;
    }));  

    // console.log(formattedTeamMembers);

 return  res.json({
      success: true,
      data: {membersData,teamSize,teamMembers:membersData.length}
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
  return  res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
};
