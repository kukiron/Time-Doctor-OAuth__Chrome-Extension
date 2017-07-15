# Time-Doctor-OAuth__Chrome-Extension
A Chrome Extension for user authentication to Time Doctor

//----------------------------- Instructions to use the Time Doctor OAuth Chrome Extension -----------------------------//


***Registering your app on Time Doctor:***
1. If you want to create your own application to connect to Time Doctor's API, you must first register your app to receive a Client ID and Client Secret Key.
2. Use your Time Doctor login details to log into - https://webapi.timedoctor.com/app/login. If you don't have an account already, sign up to create one.
3. Once logged in, click the "Register Another Application" button and complete the form on the next page. After submitting the form, save a copy of your CLIENT ID and SECRET KEY.
4. During registering your app, you must use the following link as the Redirect URL in the required field -- https://finihdbkbfnhonfbpicheohdagcgimbk.chromiumapp.org/provider_cb
5. To use this Chrome Extension for your application, go to index.js file on the root directory. Put your CLIENT ID and SECRET KEY in place of the existing ones.
6. You are all set to install & use the extension.


***How to install the extension:***
1. Unzip the package(.zip file) after downloading. Go to chrome://extensions on your Chrome browser & activate 'Developer mode'.
2. Click on 'LOAD UNPACKED'. Upload the unzipped folder from your computer.
3. Once uploaded you can click the Details to find the Extension ID & other information.
4. You'll see a Time Doctor's icon appear on the upper right corner of your browser. Click the icon.
5. Once the popup window appears, click 'Authenticate' button. It'll bring the Time Doctor's user login menu.
6. Use your email & password to log in. Allow the app to have access to your Time Doctor's account.
7. Once accessed, you'll see the list of users in your company & details of the tasks & projects that have been created in the text area of the popup.
8. The user & company ID will also appear at the top of the popup window.
9. In order to login as a different user, close your current session with the browser & then restart chrome browser. Now click the Time Doctor icon & login with the email & password of another Time Doctor account.
