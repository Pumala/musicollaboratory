# Musicollaboratory

## Objective
Create a music collaboration app.

### Live Demo:

[Music Collaboration App] (http://musicollaboratory.com/)

### Languages / Technologies used:

* HTML
* CSS
* BOOTSTRAP
* Javascript
* AngularJS
* NodeJS
* Express
* MongoDB

## Description

Users can create music projects, request to contribute to them and, if accepted, can upload/download music, and manage these projects.

## Usage

1. Securely sign up and log in.

2. Create a music project or...

3. Search music projects according to what the project needs and what you want to contribute.
 - Lyrics
 - Voice
 - Production
 - Melody
4. Request to contribute.
  *On the project page, users can learn more about the music project. They also have the option to submit a request to the project owner.
  *The request is sent to the project owner's inbox and a copy of the request is also sent to the user's outbox.
  *Then the project owner can either accept or decline the request.
  *If the request is accepted, the requester will be added to *project admin. As an admin, the user has authorization to edit the project info and upload files.

## Walk Through

#####  1. Home Page => '/'

  ![home](public/images/home.png)

#####  2. Sign Up Page => '/signup'

  ![home](public/images/signup.png)

#####  3. Profile Page => '/profile/:username'

  ![home](public/images/profile.png)

#####  4. Edit Profile Page => '/profile/:username'

  ![home](public/images/edit_profile.png)

#####  5. Save Edits to Profile Page => '/profile/:username'

  ![home](public/images/save_profile.png)

#####  6. Create New Project => '/new/project'

  ![home](public/images/create_project.png)

#####  7. Create New Project (upload project files) => '/new/project/uploads'

  ![home](public/images/upload_new_project_file.png)

#####  8. Project Detail Page => '/project/:projectid'

  ![home](public/images/project_detail_page.png)

#####  9. Edit Project Detail Page => '/project/:projectid'

  ![home](public/images/upload_project_image.png)

#####  10. Projects Search Page => '/search'

  ![home](public/images/search_projects.png)

#####  11. Listen to Audio on Project Search Page => '/search'

  ![home](public/images/search_projects_audio.png)

#####  11. Sending a Request on Project Detail Page => '/project/projectid'

  ![home](public/images/request_to_join.png)

#####  12. Request Submitted => '/project/projectid'

  ![home](public/images/request_submitted.png)

#####  13a. Check Messages from Profile Page => '/profile/:username'

  ![home](public/images/click_messages.png)

#####  13b. Messages Page => '/profile/:username/messages'

  ![home](public/images/messages_center.png)

#####  14. Messages Page (Accept Request from kirk) => '/profile/:username/messages'

  ![home](public/images/accept_request.png)

#####  15. Messages Page (After accepting Request) => '/profile/:username/messages'

  ![home](public/images/outbox_after_approval.png)

#####  16. Messages Page (Signed in as kirk) => '/profile/:username:messages'

  ![home](public/images/kirk_messages.png)

#####  17. Project Page (kirk is now a member; he's started to write a comment) => '/project/:projectid'

  ![home](public/images/members_now.png)

#####  18. Project Page (kirk posts a comment) => '/project/:projectid'

  ![home](public/images/posted_comment.png)

#####  19. Project Page (Ex. of comments section between members) => '/project/:projectid'

  ![home](public/images/several_comments.png)

#####  20. Project Page (When a project is done => you can toggle the 'mark as completed' button at the bottom of the page) => '/project/:projectid'

  ![home](public/images/toggle_complete.png)


## Code Snippets (backend)

As we're adding comments in the back_end.js file, we're encountering places in our code that require a clean-up.

#### Example 1:

Before we made only a query to delete the project from the db. Then we realized we forgot to clean up all traces of it. For instance, the project was still connected to the old members of the project. So, we needed to make another query that removed the project id from these members' projects array.

To accomplish this, we made a query to update all the members' projects arrays using the $pull operator. The $pull operator eliminates a specific value from the field that you choose. In the code below, we remove the projectId that is found anywhere in the members' projects arrays. We also set the multi parameter to true, which will allow us to update more than 1 document.

```
bluebird.all([ User.update(
    {
      _id: {
      $in: projectMembers
      }
    },
    { $pull: { projects: projectId } },
    { multi: true }
    ), Project.remove({ _id: projectId })
  ])
  .spread(function(updatedUsers, removedProject) {
    return response.json("SUCCESS!!! removing project form db...");
  })
  .catch(function(err) {
    console.log('error removing project from db:', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
  });

```

For example, below.....

#### Example 2:

Here is another place that we refactored. Originally, we made a query to find the project info using the project id. That query then returns the project info. Afterward, we saved the return value to a variable and pushed the filename to the array ( project files). Then we proceeded to make another query to update the project's files.

Original Code

```
bluebird.all([
    newFile.save(),
    Project.findOne({ _id: projectId })
  ])
  .spread(function(savedFile, projectInfo) {
    var updatedFiles = projectInfo.files;

    updatedFiles.push(filename); // add filename hash

    return Project.update({
      _id: projectId
    }, {
      $set: {
        files: updatedFiles
      }
    });

  })
  .then(function(updatedProject) {
    return response.json({
      message: 'success saving new avatar to project in db'
    });
  })
  .catch(function(err) {
    console.log('encountered error saving file to user info:', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
  });

```

However, there is a simpler query that can achieve all this. Instead of querying to find the project info, we can instead make a query to update the project with the new value using the $addToSet operator. The $addToSet operator allows us the ability to add new values to a field, such as the projects files array in this case.   

Refactored Code

```
bluebird.all([
    newFile.save(),
    Project.update(
      { _id: projectId },
      { $addToSet: { files: filename } }
    )
  ])
  .spread(function(savedFile, updatedProject) {
    return response.json({
      message: 'success saving new avatar to project in db'
    });
  })
  .catch(function(err) {
    console.log('encountered error saving file to user info:', err.message);
    response.status(500);
    response.json({
      error: err.message
    });
  });

```

## Code Snippets (frontend)



## Credits
Kirk Abott,
Carolyn Lam
