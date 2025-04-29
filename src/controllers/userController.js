const prisma = require('../lib/prisma');

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


