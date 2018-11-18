const rp = require('request-promise');
const $ = require('cheerio');
const nodemailer = require('nodemailer');
const url = 'https://xn--pevapakkumised-5hb.ee/tartu';
const time = '11:00';
const emailFrom = 'sendFrom@gmail.com';
const emailFromPassword = 'password';
const emailTo = 'sendFoodTo@fleep.io';

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

	// trigger the function triggerThis() at the timepoint
	// create setInterval when the timepoint is reached to trigger it every day at this timepoint
	setTimeout(function(){
	  triggerThis();
	  setInterval(triggerThis, 24 * 60 * 60 * 1000);
	}, firstTriggerAfterMs);
};

function scrapeFood() {
	rp(url)
	  .then(function(html){
	    //success
	    let vilde = $('.offer','#2087492733', html).text();
	    let rp9 = $('.offer','#2087492794', html).text();
	    let bigben = $('.offer','#27', html).text();
	    let tartukohvik = $('.offer','#36', html).text();
	    let illegaard = $('.offer','#2087492610', html).text();
	    let foods = "1 Vilde ja Vine: " + vilde + "\n" +
	    "2 Pubi RP9: " + rp9 + "\n" +
	    "3 Big Ben Pubi: " + bigben + "\n" + 
	    "4 Tartu Kohvik: " + tartukohvik + "\n" + 
	    "5 Illegaard: " + illegaard + "\n";
	    sendEmail(foods);
	  })
	  .catch(function(err){
	    console.log(err);
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

scheduler(time,scrapeFood);