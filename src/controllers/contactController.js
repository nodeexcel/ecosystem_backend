const prisma = require('../lib/prisma');
const csvParser =require("csv-parser");
const fs=require('fs');
const { promiseHooks } = require('v8');
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
          if (!data["First Name"] && !data["Last Name"] && !data["Email"] && !data["Phone"]&&!data["Country Code"]) {
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
              created_at:new Date(),
              countryCode:data["Country Code"]||'',
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

        const {firstName, lastName, businessName, companyName, phone, email, tags, additionalEmails, additionalPhones,countryCode} = req.body;

        if(firstName==="" && lastName==="" && companyName==="" && phone==="" && email===""){
          return res.status(400).json({
            success:false,
            // message:"Please provide contact detail"
            message:req.t('pleaseProvideContactDetail')
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
            countryCode:countryCode||'',
            created_at: new Date()
          }
        });

          return res.status(201).json({
            success: true,
            // message: "Contact added successfully"
            message:req.t('contactAdded')
          });


      }catch(error){
        console.log("Error on adding contact:", error.message);
        return res.status(500).json({
          success: false,
          // message: "Something went wrong."
          message:req.t('somethingWentWrong')
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
        const {firstName, lastName, businessName, companyName, phone, email, tags, additionalEmails, additionalPhones,countryCode} = req.body;
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
            countryCode:countryCode       
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
      const { contactIds } = req.body

      const team = await prisma.teammembers.findFirst({ where: { userId } });

      const contact=await Promise.all(contactIds.map(async(contactId)=>{

        const check=await prisma.contacts.findUnique({where:{
              id:contactId
        }});

        if(!check){
              return;
        }

       const data= await prisma.contacts.delete({
          where: {
            id: parseInt(contactId),
            team_id: team.teamId 
          }
        });
        return data;
      }))
  

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
          description,
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
      const { listId, contactIds } = req.body;

  
       if(!listId||!contactIds||!Array.isArray(contactIds)){
         return res.status(400).json({
          success:false,
          message:"Something is missing"
         });
       }


       const list=await prisma.lists.findUnique({where:{
            id:listId
       }});

       if(!list){
        return res.status(404).json({
          success:false,
          message:"List not found"
        })
       }

       await Promise.all(contactIds.map(async(contactId)=>{

                 const check = await prisma.contact_lists.findFirst({where:{
                          contactid:contactId,
                          lists_id:listId
                 }});

                 if(check){
                  return;
                 }

                 await prisma.contact_lists.create(
                   { data:{

                      contactid:contactId,
                      lists_id:listId,                   
                    }}
                 );
         
          
       }));


      return res.status(200).json({
        success: true,
        message: "Contacts added successfully",
      });
  
    } catch (error) {
      console.log("Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Something went wrong."
      });
    }
  };



  exports.getContactList = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, rows = 10, search = "", channel = "all" } = req.query;

    const numericPage = parseInt(page);
    const numericRows = parseInt(rows);

    if (!numericRows || !numericPage) {
      return res.status(400).json({
        success: false,
        message: "Please provide page and rows",
      });
    }

    const team = await prisma.teammembers.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const teamId = team.teamId;

    // Build where filter
    const whereFilter = {
      team_id: teamId,
    };

    // Add search filter on name only
    if (search) {
      const searchLower = search.toLowerCase();
      whereFilter.OR = [
        {
          firstName: {
            contains: searchLower,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: searchLower,
            mode: "insensitive",
          },
        },
      ];
    }

    // Add channel filter
    if (channel === "email") {
      whereFilter.email = { not: null };
    } else if (channel === "phone") {
      whereFilter.phone = { not: null };
    }

    const contacts = await prisma.contacts.findMany({
      where: whereFilter,
      orderBy: { created_at: "desc" },
    });

    const totalContacts = contacts.length;
    const totalPages = Math.ceil(totalContacts / numericRows);

    let currentPage = numericPage;
    let start = (currentPage - 1) * numericRows;
    let end = start + numericRows;

    // If out-of-bounds, reset to page 1
    if (start >= totalContacts) {
      currentPage = 1;
      start = 0;
      end = numericRows;
    }

    const finalContacts = contacts.slice(start, end);

    return res.status(200).json({
      success: true,
      contacts: finalContacts,
      totalContacts,
      totalPages,
      currentPage,
      message:req.t("getContact")
    });
  } catch (error) {
    console.error("ERROR GET CONTACTS:", error);
    return res.status(500).json({
      success: false,
      message: req.t("somethingWentWrong"),
    });
  }
};

  exports.updateList=async(req,res)=>{ 
      try{
        
        const userId=req.userId;
        const {listName, channel,description,listId} = req.body;
        

        if(!listName || !listId){
          return res.status(400).json({
            success:false,
            message:req.t("listNameIdReq")
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
            description: description || "",
          }
        });

        return res.status(200).json({
          success: true,
          message: req.t("listUpdate"),
          list
        });

      }catch(error){
        console.log("Error on editing contact:", error.message);
        return res.status(500).json({
          success: false,
          message: req.t("somethingWentWrong")
        });
      }
} 

exports.getLists = async (req, res) => {
  try {
    const userId = req.userId;
    const { search = "", channel = "all" } = req.query;

    const team = await prisma.teammembers.findFirst({
      where: { userId },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: req.t("teamNotFound"),
      });
    }

    // Build filter
    const listFilter = {
      team_id: team.teamId,
    };

    if (channel !== "all") {
      listFilter.channel = channel;
    }

    if (search) {
      listFilter.listName = {
        contains: search,
        mode: "insensitive",
      };
    }

    const lists = await prisma.lists.findMany({
      where: listFilter,
      orderBy: { created_at: "desc" },
    });

    // Fetch contact count for each list
    const data = await Promise.all(
      lists.map(async (list) => {
        const count = await prisma.contact_lists.count({
          where: {
            lists_id: list.id,
          },
        });

        return {
          id: list.id,
          listName: list.listName,
          description: list.description,
          activeContacts: count,
          channel: list.channel,
          createdDate: list.created_at,
        };
      })
    );

    return res.status(200).json({
      lists: data,
      success: true,
    });
  } catch (error) {
    console.error("ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: req.t("somethingWentWrong"),
    });
  }
};

exports.deleteList=async(req,res)=>{ 

   try{

    const userId=req.userId;
    const listId=req.params.id;

    if(!listId){
      return res.status(400).json({
        success:false,
        message:req.t("listIdReq")
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
        message: req.t("listNotFound")
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
      message: req.t("listDeleted"),
      list
    });

   }catch(error){
    console.log("Error on deleting list:", error.message);
    return res.status(500).json({
      success: false,
      message: req.t("somethingWentWrong")
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
        message:req.t("listNotFound")
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
      message: req.t("listDuplicate"),
      newList
    });

   }catch(error){
    console.log("Error on duplicating list:", error.message);
    return res.status(500).json({
      success: false,
      message: req.t("somethingWentWrong")
    });
   }

}

exports.viewContactList=async(req,res)=>{
  try{

    const {listId}=req.params;
  //  console.log(req.params);

    if(!listId){
      return res.status(404).json({
        message:req.t("listNotFound")
      })
    }

    const contactIds=await prisma.contact_lists.findMany({where:{
      lists_id:parseInt(listId)
    }});


    const contacts=await Promise.all(contactIds.map(async(data)=>{

      const contact=await prisma.contacts.findUnique({where:{
        id:data.contactid
      }})

      return contact

    }))


    if(!contacts){
      return res.status(200).json({
        success:true,
          contacts:[],
          message:req.t("dataNotFound")
      });
    }

    return res.status(200).json({
      success:true,
      contacts,
      message:req.t("listFetchSuccess")
    })


  }catch(error){
    console.log("ERROR ",error.message);
    return res.status(500).json({
      success:false,
      message:error.message
    })
  }


}


exports.removeContactFromList = async (req, res) => {
  try {
    const { listId, contactId } = req.body;

    if (!listId || !contactId || !Array.isArray(contactId) || contactId.length === 0) {
      return res.status(404).json({
        success: false,
        message: req.t("listIdRequired")
      });
    }

    const removedContacts = [];
    for (const id of contactId) {
      const contactInList = await prisma.contact_lists.findFirst({
        where: {
          lists_id: parseInt(listId),
          contactid: parseInt(id)
        }
      });

      if (contactInList) {
        const removed = await prisma.contact_lists.delete({
          where: {
            id: contactInList.id
          }
        });
        removedContacts.push(removed);
      }
    }

    if (removedContacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: req.t("foundInList")
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t("contactRemove"),
      removedContacts
    });
  } catch (error) {
    console.log("ERROR ", error.message);
    return res.status(500).json({
      success: false,
      message: req.t("somethingWentWrong")
    });
  }
}