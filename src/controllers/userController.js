const prisma = require('../lib/prisma');

  // Get user profile
  exports.getProfile= async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          username: true,
          email: true
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
      const { firstName,lastName, email ,city,country,image,company} = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          firstName,
          lastName,
          phoneNumber,
          city,
          country,
          image,
          company
        },
        select: {
          id: true,
          firstName: true,
          lastName:true,
          email: true
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


