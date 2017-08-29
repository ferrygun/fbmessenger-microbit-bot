'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const apiai = require('apiai');
const app2 = apiai("fbedf7da93074ba09858e05046bb4438");
const app = express()
const Spreadsheet = require('edit-google-spreadsheet')
const token = "EAAaeLkQ7oSMBAMiZBlY49ycWDBijwhRgun2PHAU8oHAIchj4aDrBdJmODm2juBo9n8ZA8Gzf6kLoez9CO3WZBidV2zjpZCGzBvlAc4dIUJt40xGylxZBaLW9XD7waGyZCHn9ELkqmFk8UuoTfi5UZAodELLZCG49CdgYnrNBRbZBVdAZDZD"

const chunk_size = 10;
let groups;
let total_group = 0;
let counter = 0;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a micro:bit Singapore chatbot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

function sendImageText(sender, element) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
         json: {
			recipient: { id: sender },
			message:{
				attachment: {
				  type: 'template',
				  payload: {
					  template_type: 'generic',
					  elements: element
				  }
				}
			}
		}
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function getProfile(id, cb){
	request({
      method: 'GET',
       uri: `https://graph.facebook.com/v2.6/${id}`,
      qs: _getQs({fields: 'first_name,last_name,profile_pic,locale,timezone,gender'}),
      json: true
    }, function(error, response, body) {
      if (error) return cb(error)
      if (body.error) return cb(body.error)

      cb(body)
    })
}


function _getQs (qs) {
    if (typeof qs === 'undefined') {
      qs = {}
    }
    qs['access_token'] = token

	return qs
}

function sendTextMessage(sender, text, cb) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
		cb();
    })
}

function sendImage(sender, imageURL, cb) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message:{
				attachment: {
					type: 'image',
					payload: {
						url: imageURL
					}
				}
			}
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
		cb();
    })
}

function sendMoreProject(sender, cb) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message:{
            	text: 'See more projects ?',
				quick_replies: [{
					content_type: 'text',
					title: 'More...',
					payload: 'MORE_PROJECTS'
				}]
			}
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
		cb();
    })
}

function senderAction (sender, payload) {
    request({
      method: 'POST',
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: token},
      json: {
        recipient: { id: sender },
        sender_action: payload
      }
    }, function(error, response, body) {
      if (error) {
		console.log('Error sending messages: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
    })
}

function sendMsg(data, sender) {
	sendImageText(sender, data, (err) => {
		if (err) {console.log(err);	}
	})
	sleep(1000);
}

function sendMsg1(data, sender, cb) {
	request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
         json: {
			recipient: { id: sender },
			message:{
				attachment: {
				  type: 'template',
				  payload: {
					  template_type: 'generic',
					  elements: data
				  }
				}
			}
		}
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        } else {
        	cb();
        }
    })

}

function getListofProject(sender){
	Spreadsheet.load({
		debug: false,
		spreadsheetId: '1aVW2z4lpenn5FPUtcNvBf6nKAie3IG5sS5QocEqxcvI',
		//worksheetId: 'od6',
		worksheetName: 'microbit',
		oauth : {
			email: 'my-project-1470745461917@appspot.gserviceaccount.com',
			keyFile: 'fd.pem'
		}
	},

	function sheetReady(err, spreadsheet) {
		if (err) {
			throw err;
		}


		spreadsheet.receive(function(err, rows, info) {
			if (err) {
				throw err;
			}

			//console.log(info);
			let title = ''; let subtitle = ''; let url = ''; let image = '';
			let ArrayData = []; 
			total_group = 0;
			counter = 0;

			for (let i=2; i<= info.totalRows; i++) {

				if(typeof rows[i][1] != 'undefined' && rows[i][1] !== null) 
					title = rows[i][1];
				else
					title = '';

				
				if(typeof rows[i][2] != 'undefined' && rows[i][2] !== null) 
					subtitle = rows[i][2];
				else
					subtitle = '';

				if(typeof rows[i][3] != 'undefined' && rows[i][3] !== null) 
					url = rows[i][3];
				else
					url = '';

				if(typeof rows[i][4] != 'undefined' && rows[i][4] !== null) 
					image = rows[i][4];
				else
					image = '';

				if(title != '' && url != '' && image != '') {	

					ArrayData.push({
						"title": title,
						"subtitle": subtitle,
						"image_url": image,
						"buttons":[{
							"type":"web_url",
							"url": url,
							"title":"See Project"
						}]
					});

				}
			}

			if (ArrayData.length>0) {
				groups = ArrayData.map( function(e,i){ 
					return i%chunk_size===0 ? ArrayData.slice(i,i+chunk_size) : null; 
				})
				.filter(function(e){ return e; });

				// console.log(groups.length);

				if(groups.length > 1) {

					sendMsg1(groups[0], sender, function(returnValue) {

						total_group = groups.length - 1;
						sendMoreProject(sender, function(returnValue) {
						});
					});
				}

				

			}
			else {
				let aritem = [
					"Sorry, I can't find any projects at this moment"
				];
				sendTextMessages(sender, aritem, 0);
			}

			
			
		});
	})
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var z = 0; z < 1e7; z++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function sendTextMessages(sender, text, i) {
    if (i < text.length) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: token},
            method: 'POST',
            json: {
                recipient: {id:sender},
                message: {text:text[i]},
            }
        }, function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
	        senderAction(sender, 'typing_on');
            sendTextMessages(sender, text, i+1);
            senderAction(sender, 'typing_off');
			sleep(1000);
        })
    } else return
}


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
		let array_item = [];

		if (event.postback) {
			let text = JSON.parse(JSON.stringify(event.postback));

			if(text.payload == 'USER_DEFINED_PAYLOAD') {

				getProfile(sender, function(returnValue) {
					let fname = returnValue.first_name;

					array_item = [
						"Hello! " + fname + ", I am micro:bit Singapore 💗",
						"You may ask me: 'list of projects'"
					];
					sendTextMessages(sender, array_item, 0);
				});
				
			}

			var reqtype = text.payload.split(' ').splice(0)[0];

			if(text.payload == 'SHARE_PAYLOAD') {
				array_item = [];
				array_item.push({
					"title": "Meet micro:bit Singapore Bot", 
					"subtitle": "Delight you with micro:bit projects and events in Singapore 🇸🇬",
					"buttons":[{
						"type":"element_share"
					}]
				});
				senderAction(sender, 'typing_on');
				sendMsg(array_item, sender);
				senderAction(sender, 'typing_off');
			}

		}

		if (event.message && event.message.hasOwnProperty('quick_reply')) {
			if(event.message.quick_reply.payload == 'MORE_PROJECTS') {

				if(total_group >= 1) {
					counter = counter + 1;


					sendMsg1(groups[counter], sender, function(returnValue) {
						
						//console.log(total_group);
						if(total_group > 0) 
							sendMoreProject(sender,function(returnValue) {
							});

						if(total_group == 0) {
							total_group = 0;
							counter = 0;
						}
					});

					total_group = total_group  - 1;
					
				} 
			}

		} else if (event.message && event.message.text) {
            let text = event.message.text

			getProfile(sender, function(returnValue) {
				let fname = returnValue.first_name;
			

				let request = app2.textRequest(text, {
				  'sessionId': sender
				});
		
				request.on('response', function(response) {
					let action = response.result.action;
					
					if(action == 'action.Project') {
						senderAction(sender, 'typing_on');
						getListofProject(sender);
						senderAction(sender, 'typing_off');
						
					}

					if(action == 'action.About') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}

					if(action == 'action.Whoareyou') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}

					
					if(action == 'input.welcome') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}

					if(action == 'smalltalk') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}

					if(action == 'input.unknown') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}

					if(action == 'input.exit') {
						senderAction(sender, 'typing_on');
						sendTextMessage(sender, response.result.fulfillment.speech, function(returnValue) {
						});
						senderAction(sender, 'typing_off');
					}
				});

				request.on('error', function(error) {
					console.log(error);
				});

				request.end();

			});
		
        }
    }
    res.sendStatus(200)
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})