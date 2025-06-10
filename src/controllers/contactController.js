const prisma = require('../lib/prisma');
const csvParser =require("csv-parser");
const fs=require('fs');
exports.uploadContact = async (req, res) => {
    try {
      const userId = req.userId;
  
  
      const team = await prisma.team.findFirst({
        where: { userId },
        select: { id: true }
      });
  
      if (!team) {
        return res.status(404).json({ error: 'Team not found for user' });
      }
  
      const filePath = req.file.path;
  
      // ⬇️ Parse CSV as a promise
      const results = await new Promise((resolve, reject) => {
        const temp = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => temp.push(data))
          .on('end', () => {
            // Delete file
            fs.unlink(filePath, (err) => {
              if (err) console.error("Failed to delete:", err);
          });
            resolve(temp);
          })
          .on('error', (err) => reject(err));
      });

      //  fs.unlink(filePath);
  
      // ⬇️ Insert valid contacts
      await Promise.all(
        results.map(async (data) => {
          if (!data["First Name"] && !data["Last Name"] && !data["Email"] && !data["Phone"]) {
            return null;
          }
  
          await prisma.contacts.create({
            data: {
              firstName: data["First Name"] || '',
              lastName: data["Last Name"] || '',
              businessName: data["Business Name"] || '',
              companyName: data["Company Name"] || '',
              phone: data["Phone"] || '',
              email: data["Email"] || '',
              created: data["Created"] || null,
              lastActivity: data["Last Activity"] || null,
              tags: data["Tags"] || '',
              additionalEmails: data["Additional Emails"] || '',
              additionalPhones: data["Additional Phones"] || '',
              team_id: team.id,
              created_at:new Date()
            }
          });
        })
      );
  
      // ⬇️ Fetch and return inserted contacts
      const list = await prisma.contacts.findMany({
        where: { team_id: team.id }
      });
  
      return res.status(200).json({
        success: true,
       message:"Contact Added"
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Error processing CSV file',
        details: error.message
      });
    }
  };

exports.addContact=async(req,res)=>{

      try{

        const userId=req.userId;

        if(!userId){
          return res.status(401).json({
            success:false,
            message:"Unauthorized"
          })
        }

        const {firstName, lastName, businessName, companyName, phone, email, tags, additionalEmails, additionalPhones} = req.body;

        if(firstName==="" && lastName==="" && companyName==="" && phone==="" && email===""){
          return res.status(400).json({
            success:false,
            message:"Please provide contact detail"
          })
        }
       const team = await prisma.team.findFirst({
          where: { userId },
          select: { id: true }
        });
         await prisma.contacts.create({
          data: {
            firstName: firstName || '',
            lastName: lastName || '',
            businessName: businessName || '',
            companyName: companyName || '',
            phone: phone || '',
            email: email || '',
            tags: tags || '',
            additionalEmails: additionalEmails || '',
            additionalPhones: additionalPhones || '',         
            team_id: team.id,
            created_at: new Date()
          }
        });

          return res.status(201).json({
            success: true,
            message: "Contact added successfully"
          });


      }catch(error){
        console.log("Error on adding contact:", error.message);
        return res.status(500).json({
          success: false,
          message: "Something went wrong."
        });
      }
  }
  
exports.updateContact=async(req,res)=>{
      try{

        const userId=req.userId;
        const {contactId}=req.body;

        if(!contactId){
          return res.status(400).json({
            success:false,
            message:"Contact ID is required"
          })
        }

        const {firstName, lastName, businessName, companyName, phone, email, tags, additionalEmails, additionalPhones} = req.body;

        if(firstName==="" && lastName==="" && companyName==="" && phone==="" && email===""){
          return res.status(400).json({
            success:false,
            message:"Please provide contact detail"
          })
        }

        const team = await prisma.teammembers.findFirst({ where: { userId } });

        const contact=await prisma.contacts.update({
          where: {
            id: parseInt(contactId),
            team_id: team.teamId 
          },
          data: {
            firstName: firstName,
            lastName: lastName ,
            companyName: companyName ,
            phone: phone ,
            email: email ,         
          }
        });

        return res.status(200).json({
          success: true,
          message: "Contact updated successfully",
          contact
        });
      }
      catch(error){
        console.log("Error on editing contact:", error.message);
        return res.status(500).json({
          success: false,
          message: "Something went wrong."
        });
      }
  }

 exports.deleteContact=async (req, res) => {
    try {
      const userId = req.userId;
      const  contactId  = req.params.id;
      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: "Contact ID is required"
        });   
      }

      const team = await prisma.teammembers.findFirst({ where: { userId } });

      const contact=await prisma.contacts.delete({
        where: {
          id: parseInt(contactId),
          team_id: team.teamId 
        }
      });

      return res.status(200).json({
        success: true,
        message: "Contact deleted successfully",
        contact
      });

    } catch (error) {
      console.log("Error on deleting contact:", error.message);     
      return res.status(500).json({
        success: false,
        message: "Something went wrong."
      });
    }

  }
  
  exports.createList = async (req, res) => {
    try {
      const { listName, channel,description} = req.body;
      const userId=req.userId;
  
      if(!listName){
        return res.status(400).json({
          success:false,
          message:"Something went wrong"
        })
      }
  
      const team = await prisma.team.findFirst({
        where: { userId },
        select: { id: true }
      });
  
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Team not found for this user"
        });
      }
      const islist=await prisma.lists.findFirst({
        where:{
            AND: [
        { listName },
        { team_id:team.id}
      ]
        }
      });
  
      if(islist){
        return res.status(400).json({
          success:false,
          message:"List Name already exist"
        })
      }
  
      const list = await prisma.lists.create({
        data: {
          listName,
          channel,
          team_id: team.id,
          created_at: new Date()
        }
      });
  
      return res.status(201).json({
        success: true,
        list
      });
  
    } catch (error) {
      console.log("Error on creating list:", error.message);
      return res.status(500).json({
        success: false,
        message: "Something went wrong."
      });
    }
  };
  
  exports.addContactToList = async (req, res) => {
    try {
      const userId = req.userId;
      const { listName, contactsId, channel } = req.body;
  
      const team = await prisma.teammembers.findFirst({
        where: { userId },
        select: { teamId: true }
      });
  
      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }
  
      let list = await prisma.lists.findFirst({
        where: {
          AND:[{ team_id: team.teamId},
            {listName}]   
        }
      });
  
      if (!list) {
        list = await prisma.lists.create({
          data: {
            listName,
            channel,
            team_id: team.teamId,
            created_at:new Date()
          }
        });
      }
      console.log("NEW LIST ",list);
  
      await Promise.all(contactsId.map(async (data) => {
        const contact = await prisma.contacts.findUnique({
          where: {
            id: parseInt(data),
          }
        });
  
        if (!contact) return;
  
        const contactInList = await prisma.contact_lists.findFirst({
          where: {
            contactid: parseInt(data),
            lists_id: list.id
          }
        });
  
        if (contactInList) return;
  
        await prisma.contact_lists.create({
          data: {
            contactid:parseInt(data) ,
            lists_id: list.id
          }
        });
      }));
  
      return res.status(200).json({
        success: true,
        message: "Contacts added successfully"
      });
  
    } catch (error) {
      console.log("Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Something went wrong."
      });
    }
  };
  
  exports.getContactList=async(req,res)=>{
     try{
    
         const userId=req.userId; 
  
         const {page,rows}=req.query;


           if(!rows||!page){
          return res.status(400).json({
            success:false,
            message:"Please provide page and rows"
          })
         }
  
         const team=await prisma.teammembers.findFirst({
          where:{
             userId
          },
          select:{
            teamId:true,
          }
         });
         if(!team){
          return res.status(404).json({
            success:false,
            message:"Team not found"
          })
         }
  
      const  teamId=team.teamId
         const contacts=await prisma.contacts.findMany({
          where:{
            team_id:teamId
          },
          orderBy:{
            created_at:"desc"
          }
         })      
  
         const finalContacts=contacts.slice((page-1)*rows,page*rows);
         return res.status(200).json({
          success:true,
          contacts:finalContacts,
          totalContacts:contacts.length,
          totalPages:Math.ceil(contacts.length/rows),
          currentPage:page
         })
         
     }catch(error){
  
       console.log("ERROR GET CONTACTS : ", error);
       return res.status(500).json({
        success:false,
        message:"Something went wrong"
       })
     }
  
  
  }
  
  exports.getLists=async(req,res)=>{
     try{
  
      const userId=req.userId;
  
  
      const team=await prisma.teammembers.findFirst({
        where:{
          userId
        }
      });
  
      const lists=await prisma.lists.findMany({
        where:{
            team_id:team.teamId
        }
      });
  
      const data=[];
  
  
      await Promise.all(lists.map(async(list)=>{
        
           const count=await prisma.contact_lists.count({
            where:{
              lists_id:list.id,
            }
           })
  
  
           data.push({
            id:list.id,
            listName:list.listName,
            activeContacts:count,
            channel:list.channel,
            createdDate:list.created_at,
           })
            
      }));
  
      return res.status(200).json({
        success:true,
        lists:data
      })
  
     }catch(error){
      console.log("ERROR : ",error.message);
      res.status(500).json({
        success:false,
        message:"Something went wrong"  
      })
     }
  }

  exports.updateList=async(req,res)=>{ 
      try{
        
        const userId=req.userId;
        const {listName, channel,description,listId} = req.body;
        

        if(!listName || !listId){
          return res.status(400).json({
            success:false,
            message:"List name and ID are required"
          })
        }

        const team = await prisma.teammembers.findFirst({ where: { userId } });

        const list=await prisma.lists.update({
          where: {
            id: parseInt(listId),
            team_id: team.teamId 
          },
          data: {
            listName,
            channel,
            // description: description || '',
          }
        });

        return res.status(200).json({
          success: true,
          message: "List updated successfully",
          list
        });

      }catch(error){
        console.log("Error on editing contact:", error.message);
        return res.status(500).json({
          success: false,
          message: "Something went wrong."
        });
      }
} 

exports.deleteList=async(req,res)=>{ 

   try{

    const userId=req.userId;
    const listId=req.params.id;

    if(!listId){
      return res.status(400).json({
        success:false,
        message:"List ID is required"
      })
    }

    const team = await prisma.teammembers.findFirst({ where: { userId } });

    const listExists = await prisma.lists.findFirst({
      where: {
        id: parseInt(listId),
        team_id: team.teamId 
      }
    });
    if (!listExists) {
      return res.status(404).json({
        success: false,
        message: "List not found"
      });
    }

    const list=await prisma.lists.delete({
      where: {
        id: parseInt(listId),
        team_id: team.teamId 
      }
    });

    return res.status(200).json({
      success: true,
      message: "List deleted successfully",
      list
    });

   }catch(error){
    console.log("Error on deleting list:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
   }
}

exports.duplicateList=async(req,res)=>{ 
   try{
    const {listId}=req.body;
    const userId=req.userId;
    if(!listId){
      return res.status(400).json({
        success:false,
        message:"List ID is required"
      })
    }
    const team = await prisma.teammembers.findFirst({ where: { userId } });
    const list=await prisma.lists.findFirst({
      where:{
        id:parseInt(listId),
        team_id:team.teamId
      }
    });
    if(!list){
      return res.status(404).json({
        success:false,
        message:"List not found"
      })
    }
    const newList=await prisma.lists.create({
      data:{
        listName:list.listName,
        channel:list.channel,
        team_id:team.teamId,
        created_at:new Date()
      }
    });

    const contactsInList=await prisma.contact_lists.findMany({
      where:{
        lists_id:list.id
      }
    });

    await Promise.all(contactsInList.map(async(contact)=>{
      await prisma.contact_lists.create({
        data:{
          contactid:contact.contactid,
          lists_id:newList.id
        }
      })
    }));
    return res.status(200).json({
      success: true,
      message: "List duplicated successfully",
      newList
    });

   }catch(error){
    console.log("Error on duplicating list:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
   }

}