const rp = require('request-promise');
const tough = require('tough-cookie');
const $ = require('cheerio');
const nodemailer = require('nodemailer');
const url = 'https://xn--pevapakkumised-5hb.ee/tartu';
const time = '11:00';
const emailFrom = 'sendFrom@gmail.com';
const emailFromPassword = 'password';
const emailTo = 'sendFoodTo@fleep.io';
const fleepUser = 'userEmail@gmail.com';
const fleepPassword = 'password';
const fleepConversationId = 'convID';
const fleepWebHookId = 'HookID';
const foodProviders = 	[
						  {"name":"Vilde ja Vine", "divId":"#2087492733"},
						  {"name":"Pubi RP9", "divId":"#2087492794"},
						  {"name":"Big Ben Pubi", "divId":"#27"},
						  {"name":"Illegaard", "divId":"#2087492610"},
						  {"name":"Sheriff Saloon", "divId":"#3456"},
						  {"name":"Tartu Kohvik", "divId":"#36"},
						  {"name":"Gustav Gastro Cafe", "divId":"#190"}
						];

function scheduler(time, triggerThis) {
	// get hour and minute from hour:minute param received, ex.: '16:00'
	const hour = Number(time.split(':')[0]);
	const minute = Number(time.split(':')[1]);

	// create a Date object at the desired timepoint
	const startTime = new Date(); startTime.setHours(hour, minute);
	const now = new Date();

	// increase timepoint by 24 hours if in the past
	if (startTime.getTime() < now.getTime()) {
	  startTime.setHours(startTime.getHours() + 24);
	}

	// get the interval in ms from now to the timepoint when to trigger email sending
	const firstTriggerAfterMs = startTime.getTime() - now.getTime();
	console.log(firstTriggerAfterMs);

	// trigger the function triggerThis() at the timepoint
	// create setInterval when the timepoint is reached to trigger it every day at this timepoint
	setTimeout(function(){
	  triggerThis();
	  setInterval(triggerThis, 24 * 60 * 60 * 1000);
	}, firstTriggerAfterMs);
};

function scrapeFood(toWhere) {
	rp(url)
	  .then(function(html){
	    //success
	    let foodCounter = 1, foods = "", foodInOffer = "";
		for (var key in foodProviders) {
			if (foodProviders.hasOwnProperty(key)) {
			  name = foodProviders[key].name;
			  divId = foodProviders[key].divId;
			  foodInOffer = $('.offer',divId, html).text();
			  if (foodInOffer == "") continue;
			  foods = foods + foodCounter + " *" + name + "* " + foodInOffer + "\n";
			  foodCounter++;
			}
			if (foodCounter > 5) break;
		}
	    console.log("Scraped food");
	    if (toWhere == "Email") {
	        sendEmail(foods);
	    } else {//Default value is fleep
	        logAndSendDataToFleep(foods);
	    }
	  })
	  .catch(function(err){
	    console.log(err);
	  });
};


function logAndSendDataToFleep(foods) {
    var _include_headers = function(body, response, resolveWithFullResponse) {
      return {'headers': response.headers, 'data': body};
    };

    var options = {
        method: 'POST',
        uri: 'https://fleep.io/api/account/login',
        body: {
            "email": fleepUser, "password": fleepPassword
        },
        json: true,
        transform: _include_headers,
    };

    rp(options)
      .then(function (response) {
        let ticket = response.data.ticket;
        let cookie = (response.headers['set-cookie'][0]).split(";")[0].split("=")[1];
        console.log("Logged into Fleep!");
        sendMessageToFleep(ticket,cookie,foods);
       })
      .catch(function (err) {
        // POST failed...
        console.log(err);
      });
};

function sendMessageToFleep(ticket,cookie,foods) {
    let cookieObject = new tough.Cookie({
        key: "token_id",
        value: cookie,
        domain: 'fleep.io',
    });
    // Put cookie in an jar which can be used across multiple requests
    var cookiejar = rp.jar();
    cookiejar.setCookie(cookieObject, 'https://fleep.io');
    // ...all requests to https://fleep.io will include the cookie

     var sendMessageOptions = {
         method: 'POST',
         //uri: 'https://fleep.io/api/message/send/' + fleepConversationId, //Old option to send direct messages
         uri: 'https://fleep.io/hook/' + fleepWebHookId,
         body: {
         "ticket": ticket,
         "message": foods,
         "user": 'Lõunad'
         },
         json: true,
         jar: cookiejar
     };


    rp(sendMessageOptions)
      .then(function (parsedBody) {
            console.log("Food sent to Fleep!")
        })
      .catch(function (err) {
        // POST failed...
        console.log(err)
      });
};


function sendEmail(emailBody) {
	let transporter = nodemailer.createTransport({
	  service: 'gmail',
	  port: 465,
	  secure: true,
	  auth: {
	    user: emailFrom,
	    pass: emailFromPassword
	  }
	});

	let mailOptions = {
	  from: emailFrom,
	  to: emailTo,
	  subject: 'Tänased lõuna pakkumised',
	  text: emailBody
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
};

//Email or directly to Fleep. Fleep is default one!
function main(method){
      scheduler(time,scrapeFood(method));
}

main("Fleep");