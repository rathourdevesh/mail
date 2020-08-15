document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  history.pushState(null, "", "/compose");

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#mailContent').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  //Sending the form data to server
  document.querySelector("#compose-recipients").multiple = true;
  document.querySelector('#compose-form').onsubmit = () => {
    console.log("Mail Sending");

    var lv_recipients = document.querySelector('#compose-recipients').value;
    var lv_subject = document.querySelector('#compose-subject').value;
    var lv_body = document.querySelector('#compose-body').value;
    console.log(lv_recipients);
    console.log(lv_subject);
    console.log(lv_body);

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: lv_recipients,
        subject: lv_subject,
        body: lv_body
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if ("message" in data) {
          console.log("Mail sent sucessfully");
          const message = data.message;
        }
        else {
          console.log("Error");
          const message = data.error;
          console.log(message);
          alert(message);

        }
      });

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    load_mailbox('sent');

    return false;
  }

}

function load_mailbox(mailbox) {

  history.pushState(null, "", `/${mailbox}`);

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#mailbox-view').style.display = 'table';
  document.querySelector('#mailContent').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  if (mailbox === "sent") {
    console.log('Sent Box');
  } else if (mailbox === "archive") {
    console.log('archive Box');
  } else {
    console.log('inbox Box');
  }

  document.querySelector('#mailbody-view').innerHTML = '';
  var template = '';

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails);

      for (i in emails) {
        console.log(emails[i].sender);
        console.log(emails[i].subject);
        console.log(emails[i].timestamp);
        if (emails[i].read == false) {
          template = template + `<tr><td onclick="openMail(${emails[i].id})">${emails[i].sender}</td><td onclick="openMail(${emails[i].id})">${emails[i].subject}</td><td onclick="openMail(${emails[i].id})">${emails[i].timestamp}</td>`
        } else {
          template = template + `<tr class="table-active"><td onclick="openMail(${emails[i].id})">${emails[i].sender}</td><td onclick="openMail(${emails[i].id})">${emails[i].subject}</td><td onclick="openMail(${emails[i].id})">${emails[i].timestamp}</td>`
        }
        if (emails[i].archived == false && mailbox !== 'sent') {
          template = template + `<td><button onclick="Archive(${emails[i].id},true)">Archive</button></td>`;
        }
        else if (emails[i].archived == true && mailbox !== 'sent') {
          template = template + `<td><button onclick="Archive(${emails[i].id},false)">Unarchive</button></td>`;
        }

        template = template + '</tr>';

      }
      document.querySelector('#mailbody-view').innerHTML = template;
    })


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function openMail(mailid) {


  console.log(mailid);

  fetch(`/emails/${mailid}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  fetch(`/emails/${mailid}`)
    .then(response => response.json())
    .then(data => {
      document.querySelector('#mailbox-view').style.display = 'none';
      document.querySelector('#mailContent').style.display = 'block';
      document.querySelector('#mailContent').innerHTML = `<strong>From :</strong> ${data.sender}<br>
    <strong>To :</strong> ${data.recipients}<br>
    <strong>Subject :</strong> ${data.subject}<br>
    <strong>Timestamp :</strong> ${data.timestamp}<br>
    <button onclick="replyMail('${mailid}')">Reply</button>
    <hr>
    <p>${data.body}</p>`

    });
}


function Archive(mailid, command) {
  console.log('Archive')
  fetch(`/emails/${mailid}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: command
    })
  });
  load_mailbox('inbox');
}

function replyMail(mailid) {
  fetch(`/emails/${mailid}`)
    .then(response => response.json())
    .then(data => {
      document.querySelector('#compose-recipients').value = `${data.sender}`;
      var sub = data.subject;

      if (sub.substring(0, 3) === 'Re:') {
        document.querySelector('#compose-subject').value = `${data.subject}`;
        var lv_body = data.body;
        lv_body = lv_body + `On ${data.timestamp} , ${data.sender} wrote :${data.body}`;
        document.querySelector('#compose-body').value = lv_body;
      }
      else {
        document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
        document.querySelector('#compose-body').value = `On ${data.timestamp} , ${data.sender} wrote :${data.body}`;
      }
    });

  compose_email();
}
