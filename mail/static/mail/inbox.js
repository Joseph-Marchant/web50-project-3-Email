document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send mail
  document.querySelector('#compose-form').onsubmit = function(event) {
    event.preventDefault(),
    send_email();
  }
})

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get and display any relevant emails
  get_emails(mailbox);
}

// On email send
function send_email() {

  // Get the required info
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  // Post to emails
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })

  // Get the response
  .then(response => response.json())
  .then(result => {
    console.log(result);
  })

  // Redirect to sent mailbox
  .then(() => {
    load_mailbox('sent');
  });
}

// Emails for load_mailbox
function get_emails (mailbox) {

  // Get emails from the server
  fetch(`/emails/${mailbox}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);

    // Create div for each email
    data.forEach(data => {
      const div = document.createElement('div')
      div.setAttribute('onclick', `view_email(${data.id}, ${mailbox})`);

      // Check if the email has been read or not and set id accordingly
      if (data.read === true) {
        div.setAttribute('class', 'email read')
      } else {
        div.setAttribute('class', 'email unread')
      };

      // Fill the content of the div
      if (mailbox === sent) {
        div.innerHTML = `${data.recipients} - ${data.subject} - ${data.timestamp}`
      } else {
        div.innerHTML = `${data.sender} - ${data.subject} - ${data.timestamp}`
      };

      // Display on page
      document.querySelector('#emails-view').append(div);
    });
  });
}

// View email
function view_email(email, mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'block';

  // Clear any previous emails
  if (document.querySelector('#displayed-email')) {
    const e = document.querySelector('#displayed-email');
    const b = document.querySelector('#response-buttons');
    e.remove();
    b.remove();
    
  };

  // Fetch the email from server
  fetch(`/emails/${email}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
  
    // Display the email
    const display = document.createElement('div');
    display.innerHTML = `
      <div id="sender">From: ${data.sender}</div>
      <div id="recipient">To: ${data.recipients}</div>
      <div id="timestamp">On: ${data.timestamp}</div>
      <div id="subject">${data.subject}</div>
      <textarea disabled id="body">${data.body}</textarea>
    `;
    display.setAttribute('id', 'displayed-email');
    document.querySelector('#single-email').append(display);

    // Buttons for reply and archive
    const buttons = document.createElement('div');

    // If we have come from the sent mailbox, don't load the archive button
    const reply = `<button class="email-replies btn btn-sm btn-outline-primary" id="reply" onclick="reply(${data.id})">Reply</button>`
    if (mailbox === sent) {
      buttons.innerHTML = `
          ${reply}
        `;

    // Otherwise
    } else {
      if (data.archived === true) {
        buttons.innerHTML = `
          ${reply}
          <button class="email-replies btn btn-sm btn-outline-primary" id="archive" onclick="email_archive(${data.id})">Unarchive</button>
        `;
      } else {
        buttons.innerHTML = `
          ${reply}
          <button class="email-replies btn btn-sm btn-outline-primary" id="archive" onclick="email_archive(${data.id})">Archive</button>
        `;
      }
    }

    // Display the buttons
    buttons.setAttribute('id', 'response-buttons');
    document.querySelector('#single-email').append(buttons);
  })

  // Update that the email has been read
  fetch(`/emails/${email}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}

// When the archive button is pressed
function email_archive(email) {

  // Get the email and check if it is archived or not
  fetch(`/emails/${email}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    
    // If the email needs to be archived
    if (data.archived === false) {
      // Update the archive field
      fetch(`/emails/${email}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      .then(() => {
        load_mailbox('inbox');
      });
      
    // If the email needs to be unarchived
    } else {
      // Update the archive field
      fetch(`/emails/${email}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(() => {
        load_mailbox('inbox');
      });
    };
  });
}

// For replies
function reply(email) {

  // Get the email and check if it is archived or not
  fetch(`/emails/${email}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);

    // Display compose email page
    compose_email()

    // Fill fields with data
    document.querySelector('#compose-recipients').value = `${data.sender}`;
    let subject = data.subject
    let test = subject.slice(0, 3)
    console.log(test)
    if (test === `Re:`) {
      document.querySelector('#compose-subject').value = `${data.subject}`;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
    }
    document.querySelector('#compose-body').value = `\n\n\nOn ${data.timestamp} ${data.sender} wrote:\n${data.body}`;  
  });
}
