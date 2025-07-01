const { googleLogin } = require("../controllers/authController")
const { passwordResetToken } = require("./prisma")

exports.english={
            translation:{
                userNotFound:"User not found",
                userDeactivated:"User is deactivated , Please reactivate the account .",
                noTokenProvided:"No token provided",
                invalidToken:"Invalid token",
                invalidOtp:"Invalid OTP",
                errorSendingOTPEmail:"Error on sending OTP in email",
                otpSent:"OTP sent to your email",
                otpExpired:"OTP has expired",
                otpVerified:"OTP verified successfully",
                otpNotVerified:"OTP not verified",
                otpNotSent:"OTP not sent",
                errorCheckingUserProfile:"Error checking user profile",
                profileActive:"Profile is active",
                accountDeactivated:"The account is deactivated, reactivate your account",
                invalidCredentials:"Invalid credentials",
                loginSuccessful:"Login successfull",
                logoutSuccessful:"Logout successfully",
                errorOnLogin:"Error on login",

                refereshTokenRequired:"refreshToken is required",
                tokenExpired:"Token is expired",

                tokenGeneratedSuccess:"Token generated successfully",

                invalidRefreshToken:"Not valid refresh token",

                googleLoginError:"Error during Google login",
                profileActiveted:'Profile activated successfully',
                resourseMissing:"Resources are missing",  

                passowrdSet:"Password set successfully",
                errorSettingPassword:"Error setting password",

                pleaseProvideContactDetail:"Please provide contact detail",
                contactAdded:"Contact added successfully",
                somethingWentWrong:"Something went wrong",
                getContact:"Contact get succesfully",

                teamNotFound:"Team not found",
                userNotFound:"No user found",
                userNotFoundAtSignup:"User not found Please signup first",
                userAlreadyDeleted:"User already deleted .",
                errorFetchingProfile:"Error fetching user profile",
                userDelete:"User deleted",

                emaiLPriceId:"Email and Price ID are required",
                noActiveSub:"No active subscription found for this user",
                subId:"Subscription item ID not found",
                otpSent:"OTP Sent",
                emailRequired:"Email is required",
                passwordResetEmail:"Password reset email sent",
                failedToSent:"Failed to send reset email"
                
             

            }
        }

exports.french={
            translation:{
                userNotFound:"Utilisateur non trouvé",
                userDeactivated:"Utilisateur désactivé, veuillez réactiver le compte.",
                noTokenProvided:"Aucun token fourni",
                invalidToken:"Token invalide",
                invalidOtp:"OTP invalide",
                errorSendingOTPEmail:"Erreur lors de l'envoi de l'OTP par email",
                otpSent:"OTP envoyé à votre email",
                otpExpired:"OTP a expiré",
                otpVerified:"OTP vérifié avec succès",
                otpNotVerified:"OTP non vérifié",
                errorCheckingUserProfile:"Erreur lors de la vérification du profil utilisateur",
                profileActive:"Profil actif",     
                accountDeactivated:"Le compte est désactivé, veuillez réactiver votre compte",
                invalidCredentials:"Identifiants invalides",
                loginSuccessful:"Connexion réussie",
                errorOnLogin:"Erreur lors de la connexion",

                refereshTokenRequired:"refreshToken est requis",
                tokenExpired:"Le jeton est expiré",

                tokenGeneratedSuccess:"Jeton généré avec succès",

                logOut:"Déconnexion réussie",

                
                invalidRefreshToken:"Jeton d'actualisation non valide",

                googleLoginError:"Erreur lors de la connexion à Google",
                profileActiveted:"Profil activé avec succès",
                resourseMissing:"Il manque des ressources",

                passwordSet:"Mot de passe défini avec succès",
                errorSettingPassword:"Erreur lors de la définition du mot de passe",



                pleaseProvideContactDetail:"Veuillez fournir les détails du contact",
                contactAdded:"Contact ajouté avec succès",
                somethingWentWrong:"Quelque chose s'est mal passé",
                getContact:"Contact réussi",
                teamNotFound:"Équipe introuvable",
                userNotFound:"Aucun utilisateur trouve",
                userNotFoundAtSignup:"utilisateur non trouvé à l'inscription",
                   userAlreadyDeleted:"Utilisateur déjà supprimé.",
                   errorFetchingProfile:"Erreur lors de la récupération du profil utilisateur",

                   userDelete:"Utilisateur supprimé",
                   emaiLPriceId:"L'adresse e-mail et l'identifiant de prix sont obligatoires",
                   noActiveSub:"Aucun abonnement actif trouvé pour cet utilisateur",
                   otpSent:"OTP envoyé",
                   emailRequired:"L'e-mail est requis",
                   failedToSent:"Échec de l'envoi de l'e-mail de réinitialisation",
                   passwordResetEmail:"E-mail de réinitialisation du mot de passe envoyé"

            }
        }

