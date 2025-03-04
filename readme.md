# Match-Me Web - Quick Set-Up for Testing

Full-stack recommendation application that connects users based on their mutual musical interests.

Team project with Marius Soon. My role has been building the UX/UI in Figma, converting the design to frontend code, connecting the necessary points to backend API-s, setting up Docker and deploying it in Render.

Quick set-up for testing:

1. Download as a zip folder and extract to anywhere you like for example desktop
2. Download and install suitable latest PostgreSQL installer at https://www.postgresql.org/download/
3. During installation set the username as postgres and password as 123, ensure pgadminpsql cli tools are installed, if you already have postgres installed, please open applications.properties from the match-me/src/main/resources project folder and change the password 123 to your own password on line 4 in "spring.datasource.password=123" or change your password to 123 through query tool in postgres, also make sure that the postgres server address is localhost and port 5432
4. Open pgadmin from the postgres directory and run "CREATE DATABASE matchmedb;" in the query tool
5. Open the project in your desired IDE
6. Enter "cd client" in terminal
7. Enter "npm install" in terminal to get all dependencies
8. Enter "npm start" in terminal to start the application
9. Go to localhost:5173 in your web browser to test the app
    

