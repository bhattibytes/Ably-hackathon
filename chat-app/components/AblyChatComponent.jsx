import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect.js";
import styles from '../styles/AblyChatComponent.module.css';
import { Editor } from '@tinymce/tinymce-react';
import parse from 'html-react-parser';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

const AblyChatComponent = () => {
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [value, setValue] = useState("");
  const [channelName, setChannelName] = useState("home");
  const [channels, setChannels] = useState(["home", "charla", "general", "random", "help", "dev"]);
  const [privateChannels, setPrivateChannels] = useState([]);
  const [allPrivateChannelInfo, setallPrivateChannelInfo] = useState([{}]);
  const [directMessageChannels, setDirectMessageChannels] = useState([]);
  const [directMessagesInfoFromDB, setDirectMessagesInfoFromDB] = useState([]);
  const { data: session, status } = useSession();
  const [messagesFromDB, setMessagesFromDB] = useState([]);
  const [members, setMembers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]); 
  const [regNames, setRegNames] = useState([]);
  const [membersTyping, setMembersTyping] = useState([]);
  const [tempMessages, setTempMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyToAuthor, setReplyToAuthor] = useState('');

  async function queryUsersWithPartiQL() {
    const statement = 'SELECT * FROM "ably_users"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        setMessagesFromDB(data.Items);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  async function queryDirectMsgsWithPartiQL() {
    const statement = 'SELECT * FROM "ably_direct_messages"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        let membersFromDB = [];
        let itemToPull;
        data.Items.forEach((item) => {
          if (item.memberNames.SS.includes(session.user.name)) {
            itemToPull = item;
            item.memberNames.SS.forEach((name) => {
              if (!membersFromDB.includes(name)) {
                membersFromDB.push(name);
              }
            });
          }
        });
        setDirectMessageChannels([...membersFromDB]);
        setDirectMessagesInfoFromDB(data.Items);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  async function queryChannelsWithPartiQL() {
    const statement = 'SELECT * FROM "ably_channels"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      setallPrivateChannelInfo(data.Items);
      if (data.Items.length) {
        let channelsFromDB = [];
        data.Items.forEach((item) => {
          if (item.channelMembers.SS.includes(session.user.name)) {
            channelsFromDB.push(item.channelName.S);
          }
        });
        setPrivateChannels([...channelsFromDB]);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  const addRegisteredUsers = async () => {
    const statement = 'SELECT * FROM "ably_registered"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        let usersFromDB = [];
        let namesFromDB = [];
        data.Items[0].userNames.L.forEach((item, index) => {
          usersFromDB.push({name: item, email: data.Items[0].userEmails.L[index], image: data.Items[0].userImages.L[index]});
          namesFromDB.push(item);
        });
        setRegisteredUsers([...usersFromDB]);
        setRegNames([...namesFromDB]);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });
  }

  const [channel, realtime] = useChannel(channelName, async (message) => {
    let messagesFromDBCall = [];
    let directMessagesInfoFromDBCall = [];
    setTimeout(async() => { messagesFromDBCall = await queryUsersWithPartiQL(); }, 10);
    setTimeout(async() => { directMessagesInfoFromDBCall = await queryDirectMsgsWithPartiQL(); }, 10);
    return new Promise((resolve, reject) => {
      resolve(messagesFromDBCall);
      resolve(directMessagesInfoFromDBCall);
    }).catch((error) => {
      console.log('error: ', error);  
      reject(error);
    }).then(() => {
        setMessagesFromDB((messagesFromDB)=> { 
          if (Array.isArray(messagesFromDB)) {
            return [...messagesFromDB, ...messagesFromDBCall]
          } else {
            return [...messagesFromDBCall]
          }
        });
        setDirectMessagesInfoFromDB((directMessagesInfoFromDB)=> { 
          if (Array.isArray(directMessagesInfoFromDB)) {
            return [...directMessagesInfoFromDB, ...directMessagesInfoFromDBCall]
          } else {
            return [...directMessagesInfoFromDBCall]
          }
        });
      });
    }
  );

  const saveUserToDB = async () => {
    let userInDB = false;
    return await new Promise((resolve, reject) => {
      resolve(regNames.forEach((name) => {
        if (name.S === session.user.name) {
          userInDB = true;
          console.log('User was found in DB');
        }
      }));
    }).then(() => {
      if (userInDB === false && registeredUsers.length) {
        dynamodb.updateItem({
          TableName: 'ably_registered',
          Key: {
            'id': { S: '1' },
          },
          UpdateExpression: 'SET userEmails = list_append(userEmails, :userEmails), userNames = list_append(userNames, :userNames), userImages = list_append(userImages, :userImages)',
          ExpressionAttributeValues: {
            ':userEmails': { L: [{S: session.user.email}] },
            ':userNames': { L: [{S: session.user.name}] },
            ':userImages': { L: [{S: session.user.image}] },
          },
          ReturnValues: 'ALL_NEW',
        }, function(err, data) {
          if (err) {
            console.log('Error', err);
          } else {
            console.log('Success MSG: ', data);
          }
        });
  }}).catch((error) => {
      console.log('error: ', error);  
      reject(error);
    });
  }

  const saveDirectMessageToDB = async (name, email, image, msg) => {
    Array.isArray(directMessagesInfoFromDB) && directMessagesInfoFromDB.forEach((message) => {
      if (message.memberEmails.SS.includes(email)) {
        dynamodb.updateItem({
          TableName: 'ably_direct_messages',
          Key: {
            'id': { S: message.id.S },
          },
          UpdateExpression: 'SET messages = list_append(messages, :messages), messageAuthors = list_append(messageAuthors, :messageAuthors), messageAuthorImgs = list_append(messageAuthorImgs, :messageAuthorImgs)',
          ExpressionAttributeValues: {
            ':messages': { L: [{ S: msg }] },
            ':messageAuthors': { L: [{ S: session.user.name }] },
            ':messageAuthorImgs': { L: [{ S: session.user.image }] },
          },
          ReturnValues: 'ALL_NEW',
        }, function(err, data) {
          if (err) {
            console.log('Error', err);
          } else {
            console.log('Success MSG: ', data);
          }
        });
      } 
    });
    if ( typeof directMessageChannels === 'object' && 
    typeof directMessageChannels.then === 'function' && 
    directMessageChannels.then((data) => data === undefined 
    )) {
      dynamodb.putItem({
        TableName: 'ably_direct_messages',
        Item: {
          'id': { S: uuidv4() },
          'ownerName' : { S: session.user.name },
          'ownerEmail' : { S: session.user.email },
          'memberEmails': { SS: [session.user.email, email] },
          'memberNames': { SS: [session.user.name, name] },
          'memberImages': { SS: [session.user.image, image] },
          'timestamp': { S: new Date().toISOString() },
          'messages': { L: [{ S: msg }] },
          'messageAuthors': { L: [{ S: session.user.name }] },
          'messageAuthorImgs': { L: [{ S: session.user.image }] },
        }
      }, function(err, data) {
        if (err) {
          console.log('Error', err);
        } else {
          console.log('Success MSG: ', data);
        }
      });
    } else if ( Array.isArray(directMessageChannels) && !directMessageChannels.includes(name) ) {
      dynamodb.putItem({
        TableName: 'ably_direct_messages',
        Item: {
          'id': { S: uuidv4() },
          'ownerName' : { S: session.user.name },
          'ownerEmail' : { S: session.user.email },
          'memberEmails': { SS: [session.user.email, email] },
          'memberNames': { SS: [session.user.name, name] },
          'memberImages': { SS: [session.user.image, image] },
          'timestamp': { S: new Date().toISOString() },
          'messages': { L: [{ S: session.user.name, S: msg }] },
          'messageAuthors': { L: [{ S: session.user.name }] },
          'messageAuthorImgs': { L: [{ S: session.user.image }] },
        }
      }, function(err, data) {
        if (err) {
          console.log('Error', err);
        } else {
          console.log('Success MSG: ', data);
        }
      });
    }
  }

  const saveChannelToDB = async (channelName) => {
    if (privateChannels.includes(channelName)) {
      alert("This channel already exists")
      return;
    }
    dynamodb.putItem({
      TableName: 'ably_channels',
      Item: {
        'id': { S: uuidv4() },
        'channelOwner': {S: session.user.email},
        'ownerName': { S: session.user.name },
        'channelName': { S: channelName },
        'timestamp': { S: new Date().toISOString() },
        'connectionId': { S: realtime.connection.id },
        'channelMembers': { SS: [session.user.name] },
        'channelMembersImg': { SS: [session.user.image] },
      }
    }, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success MSG: ', data);
        queryChannelsWithPartiQL();
      }
    });
  };

  const typingIndicator = (content) => {
    if (content !== '') {
      channel.presence.enterClient('ably-nextjs-chat', 
      {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: true}, 
      function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
      channel.presence.get(function(err, members) {
        if (err) {
          console.log('error: ', err);  
        } else {
          members = Array.from(new Set(members));
          setMembersTyping(members.filter((member) => member.data.isTyping === true).map((member) => member.data));
        }
      });
      channel.presence.subscribe('enter', function(member) {
        setMembers((members)=> {
          members.push(member.data);
          members = Array.from(new Set(members));
          return [...members]
        });
      })
    } else {
      channel.presence.leaveClient('ably-nextjs-chat', 
      {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, 
      function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
    }
  }

  const getPresenceTyping = async (content) => {
    return new Promise((resolve, reject) => {
    if (content !== '') {
      channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        members = members.filter((member) => member.data.isTyping)
        members = Array.from(new Set(members));
        setMembersTyping(members);
      }
    });
    } else {
      channel.presence.leaveClient('ably-nextjs-chat', {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
    }
    resolve();
    }).catch((error) => {
      console.log('error: ', error);  
      reject(error);
    });
  }
  useEffect(() => {
    channel.presence.enterClient('ably-nextjs-chat', 
    {email: session?.user.email, image: session?.user.image, author: session?.user.name, isTyping: false}, 
    function(err) {   
      if (err) {
        console.log('error: ', err);  
      }
    });

    channel.presence.subscribe('enter', function(member) {
      setMembers((members)=> {
        members.push(member.data);
        members = Array.from(new Set(members));
        return [...members]
      });
    });

    channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        setMembers(members.map((member) => member.data));
      }
    });
    if (!session) { channel.presence.enterClient('ably-nextjs-chat', 
        {email: session?.user.email, image: session?.user.image, author: session?.user.name, isTyping: false}, 
        function(err) {   
          if (err) {
            console.log('error: ', err);  
          }
        });
      }
  
    setMessagesFromDB(async() => await queryUsersWithPartiQL());
    setPrivateChannels(async() => await queryChannelsWithPartiQL());
    setDirectMessageChannels(async() => await queryDirectMsgsWithPartiQL());
  }, [session]);

  const handleReply = (e) => {
    let author = e.target.parentElement.children[1].children[0].innerText;
    let message = e.target.parentElement.children[1].children[1].innerText;

    setReplyMessage(message);
    setReplyToAuthor(author);
    overlay2.style.display = 'flex';
  }

  const handleReplyClose = (e) => {
    overlay2.style.display = 'none';
  }

  var parsedMessages = [];
  if (Array.isArray(messagesFromDB) && Array.isArray(directMessagesInfoFromDB) && Array.isArray(privateChannels)) {
    if ((channels.includes(channelName) || privateChannels.includes(channelName)) && messagesFromDB?.length && session && status === 'authenticated') {
        var sorted = messagesFromDB.sort((a, b) => new Date(a.timestamp.S).getTime() - new Date(b.timestamp.S).getTime() );
        sorted = sorted.filter((message) => message.channel ? message.channel.S === channelName : null );
        
        parsedMessages = sorted.map((message, index) => {
          let parsedMessage;
          const author = message.author.S
          try {
            parsedMessage = parse(message.message.S);
          } catch (error) {
            console.log(error);
            parsedMessage = message.message.S;
          } 
          return (
            <span key={`${index}=Messages`} className={styles.messages}>
              { session.user.email === message.email.S ? 
                <>
                  <img height={40} className={styles.messageImgMe} src={message.image.S}/>   
                  <span className={styles.messageMe} data-author={author}>
                    <span className={styles.authorMe}>{author}<br/></span>
                    <span className={styles.parsedMsgMe}>{parsedMessage}</span>
                  </span>     
                </>
                :
                <>
                  <span onClick={(e)=>handleReply(e)} className={styles.replyBtn}>↪️</span>
                  <span className={styles.message} data-author={author}> 
                    <span id="other" className={styles.author}>{author}<br/></span>
                    <span className={styles.parsedMsg}>{parsedMessage}</span>
                  </span>
                  <img height={40} className={styles.messageImg} src={message.image.S}/>
                </>
              }
            </span>
            )
        });
    } else if ((!channels.includes(channelName) && !privateChannels.includes(channelName)) && directMessagesInfoFromDB?.length && session && status === 'authenticated') {
      var sorted = directMessagesInfoFromDB.filter((message) => message.memberEmails.SS.includes(session.user.email));

      parsedMessages = sorted.map((message, index) => {
        let parsedMessage;
        let authorFirstName;
        let authorImg;
        let allMessages = [];
        for (let i = 0; i < message.messages.L.length; i++) {
          try {
            parsedMessage = parse(message.messages.L[i].S);
          }
          catch (error) {
            console.log(error);
            parsedMessage = message.messages.L[i].S;
          }
          authorFirstName = message.messageAuthors.L[i].S.split(' ')[0];
          authorImg = message.messageAuthorImgs.L[i].S;
          allMessages.push(
            <span key={`${i}=Messages`} className={styles.messages}>
              { session.user.name.split(' ')[0] === authorFirstName ?
                <>
                  <img height={40} className={styles.messageImgMe} src={authorImg}/>
                  <span className={styles.messageMe} data-author={authorFirstName}>
                    <span className={styles.authorMe}>{authorFirstName}<br/></span>
                    <span className={styles.parsedMsgMe}>{parsedMessage}</span>
                  </span>
                </>
                :
                <>
                  <span className={styles.message} data-author={authorFirstName}>
                    <span id="other" className={styles.author}>{authorFirstName}<br/></span>
                    <span className={styles.parsedMsg}>{parsedMessage}</span>
                  </span>
                  <img height={40} className={styles.messageImg} src={authorImg}/>
                </>
              }
            </span>
          )
        }
        return allMessages;
      });
    }
  }

  const form = document.querySelector('form#chat-form');
  const form2 = document.querySelector('form#chat-form2');
  const overlay = document.querySelector('div#overlay');
  const overlay2 = document.querySelector('div#overlay2');

  const sendChatMessage = async (messageText, replyMessage="") => {
    if (messageText !== '' && !directMessageChannels.includes(channelName) && replyMessage === '') {
      await channel.publish({ 
        name: channelName, 
        data: `<strong>${messageText.slice(3, -4) + '</strong>' + '<em id="date">at '+ new Date().toLocaleString().split(',')[1]}</em>`,
        extras: { 
          headers: { "x-ably-directMessage": false, "x-ably-channelName": channelName, "x-ably-author": session.user.name, "x-ably-authorEmail": session.user.email, "x-ably-authorImage": session.user.image }
        }
      });
      setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
      setMessageText("");
    } else if (messageText !== '' && !directMessageChannels.includes(channelName) && replyMessage !== '') {
      await channel.publish({ 
        name: channelName, 
        data: `<p className="replyMsgPara"><span className="replyIcon">⬇️</span>Replying to message: <em className="replyMsg">"${replyMessage}"</em> from ${replyToAuthor}</p><strong>${messageText.slice(3, -4) + '</strong>' + '<em id="date">at '+ new Date().toLocaleString().split(',')[1]}</em>`,
        extras: { 
          headers: { "x-ably-directMessage": false, "x-ably-channelName": channelName, "x-ably-author": session.user.name, "x-ably-authorEmail": session.user.email, "x-ably-authorImage": session.user.image }
        }
      });
      setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
      setMessageText("");
    }
    if (messageText !== '' && directMessageChannels.includes(channelName)) {
      let dmID = '';
      directMessagesInfoFromDB.forEach((message) => {
        if (message.memberEmails.SS.includes(session.user.email) && message.memberEmails.SS.includes(message.ownerEmail.S)) {
          dmID = message.id.S;
        }
      });
      if (dmID !== '') {
      await channel.publish({ 
        name: channelName, 
        data: `<strong>${messageText.slice(3, -4) + '</strong>' + '<em id="date">at '+ new Date().toLocaleString().split(',')[1]}</em>`,
        extras: { 
          headers: { "x-ably-directMessage": true, "x-ably-dmID": dmID, "x-ably-channelName": channelName, "x-ably-author": session.user.name, "x-ably-authorEmail": session.user.email, "x-ably-authorImage": session.user.image }
        }
      }); 
      setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
      
      realtime.channels.get(channelName).history((err, page) => {
        let messages = page.items.reverse();

        setTempMessages([...messages]);
        setDirectMessagesInfoFromDB((directMessagesInfoFromDB)=> { 
          if (Array.isArray(directMessagesInfoFromDB)) {
            [...directMessagesInfoFromDB]
          }
        });
      });
      setTimeout(() => { setDirectMessagesInfoFromDB(queryDirectMsgsWithPartiQL()); }, 50);
      } else {
        console.log('dmID was not found');
      }
    } 
  }
  
  const handleFormSubmission = (event) => {
    event.preventDefault();
    if (messageText === '') {
      alert("Please enter a message")
    } else if (replyMessage === '' ) { 
      sendChatMessage(messageText);
      form.reset();
    } else {
      sendChatMessage(messageText, replyMessage);
      form2.reset();
      setReplyMessage('');
      setReplyToAuthor('');
      overlay2.style.display = 'none';
    }
  }

  const createChannel = async () => {
    if (value === '') {
      alert("Please enter a channel name")
      return;
    }
    let channelExists = false;
    const statement = 'SELECT * FROM "ably_channels"';
    await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
     data.Items.forEach((item) => {
        if (item.channelName.S === value.toLowerCase()) {
          alert("This channel name is already taken by another user")
          setValue("");
          channelExists = true;
          return;
        }
      })
      if (channelExists) {
        return;
      }
      if (privateChannels.includes(value.toLowerCase())) {
      alert("This channel already exists")
      setValue("");
      } else {
        setChannelName(value.toLowerCase());
        const newChannel = realtime.channels.get(value.toLowerCase());
        newChannel.attach();
        newChannel.publish({ 
          name: value.toLowerCase(), 
          data: `A New Channel named <strong>"${value.toLowerCase()}"</strong> was created <em id="date"> at ${new Date().toLocaleString().split(',')[1]}</em>` 
        });
        newChannel.once("attached", () => {
          newChannel.history((err, page) => {
            setMessagesFromDB((messagesFromDB)=>{
              if (Array.isArray(messagesFromDB)) {
                return [...messagesFromDB, ...page.items.reverse()]
              } else {
                return [...page.items.reverse()]
              }
              
            });
            setPrivateChannels((privateChannels)=> {
              if (Array.isArray(privateChannels)) {
                return [...privateChannels, value.toLowerCase()]
              } else { 
                return [value.toLowerCase()]
              }
              });
            saveChannelToDB(value.toLowerCase());
            
          });
          setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
          setTimeout((privateChannels) => {
            if (Array.isArray(privateChannels)) {
              return [...privateChannels, value.toLowerCase()]
            } else { 
              return [value.toLowerCase()]
            }
          }) }, 100);
          setValue("");
      }
    }).catch((error) => {
      console.log('error: ', error);  
    }
    );
  }
  
  const switchChannel = (e) => {
    e.preventDefault();
    const newChannelName = e.target.innerText.slice(2);
    if (newChannelName === "#" || newChannelName === "") {
      return;
    }
    setChannelName(newChannelName);
    if (newChannelName === channelName) {
      alert("You are already in this channel")
      return;
    } else {
      const newChannel = realtime.channels.get(newChannelName);
      newChannel.attach();
    if (directMessageChannels.includes(newChannelName)) {
      let dmID = '';
      directMessagesInfoFromDB.forEach((message) => {
        if (message.memberEmails.SS.includes(session.user.email)) {
          dmID = message.id.S;
        }
      });
      newChannel.publish({ 
        name: newChannelName, 
        data: `Switched to direct message with: <strong>"${newChannelName}"</strong> and <strong>"${session.user.name}"</strong> <em id="date">at ${new Date().toLocaleString().split(',')[1]}</em>`,
        extras: { 
          headers: { "x-ably-directMessage": true, "x-ably-dmID": dmID, "x-ably-channelName": newChannelName, "x-ably-author": session.user.name, "x-ably-authorEmail": session.user.email, "x-ably-authorImage": session.user.image }
        }
      });
      newChannel.history((err, page) => {
        let messages = page.items.reverse();
        setMessagesFromDB((messagesFromDB)=>{
          if (Array.isArray(messagesFromDB)) {
            return [...messagesFromDB, ...messages]
          }
        });
      });
    } else {
      newChannel.publish({ 
        name: newChannelName, 
        data: `Switched to channel: <strong>"${newChannelName}"</strong> <em id="date">at ${new Date().toLocaleString().split(',')[1]}</em>`,
        extras: { 
          headers: { "x-ably-directMessage": false, "x-ably-channelName": newChannelName, "x-ably-author": session.user.name, "x-ably-authorEmail": session.user.email, "x-ably-authorImage": session.user.image }
        }
      });
    }
      newChannel.history((err, page) => {
        let messages = page.items.reverse();
        setMessagesFromDB((messagesFromDB)=>{
          if (Array.isArray(messagesFromDB)) {
            return [...messagesFromDB, ...messages]
          }
        });
      });
    }
  }

  const getUniqueMembers = (code) => {
    if (code === 1) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          if (members[i].author === members[j].author) {
            members.splice(j, 1);
          }
        }
      }
      return members.map((member, i) => {
        return (
          <div className={styles.onlineUsersList} key={`${i}=MemberList`}>
            <img src={member.image} width={40} style={{ borderRadius: "25px", border: "1px solid white" }} onClick={createPrivateMessage} id={`${member.author},${member.email}`}/> 
            <span className={styles.onlineName}>{member.author}
            { membersTyping.map((memberType, index) => {
              if (memberType.author === member.author && memberType.isTyping === true && messageText !== '' ) {
              return (
                <img key={index} className={styles.typing} id="typing-indicator" src="https://www.slicktext.com/images/common/typing-indicator-loader.gif"/>
              )
            } else {
              return null;
            }
            })}
            </span>
          </div>
        )
      })
    }
    if (code === 2) {
      return registeredUsers.map((member, i) => {
        return (
          <div key={`${i}=MemberInvite`} className={styles.overlayMem}>
            <img src={member.image.S} width={60} style={{ borderRadius: "40px" }} id={member.name.S}/>
            <button className={styles.inviteBtn} onClick={() => handleInviteUserToChannel(member.name.S, member.image.S)}>Invite</button> 
          </div>
        )
      })
    }

    if (code === 3) {
      return allPrivateChannelInfo.filter((member, i) => { 
      if (member.channelName?.S === channelName && member.channelMembersImg?.SS) {
        return (member);
      }
    })
    }
  }

  const createPrivateMessage = (e) => {
    const name = e.target.id.split(',')[0]
    const email = e.target.id.split(',')[1]
    const image = e.target.src;
    if (name === session.user.name) {
      alert("You cannot send a private message to yourself")
      return;
    }
    if (Array.isArray(directMessageChannels) && directMessageChannels.includes(name)) {
      alert("You are already in a private chat with this user")
      return;
    }

    const firstMessage = `A New Direct Message with <strong>"${name}"</strong> was created <em id="date"> at ${new Date().toLocaleString().split(',')[1]}</em>`;

    setChannelName(name);

    saveDirectMessageToDB(name, email, image, firstMessage)

    const newChannel = realtime.channels.get(name);
        newChannel.attach();
        newChannel.publish({ 
          name: name, 
          data: firstMessage
        });
    setDirectMessageChannels((directMessageChannels)=> {
      if (Array.isArray(directMessageChannels)) {
        return [...directMessageChannels, name]
      } else {
        return [name]
      }
    });
    newChannel.history((err, page) => {
      let messages = page.items.reverse();
      setMessagesFromDB((messagesFromDB)=>{
        if (Array.isArray(messagesFromDB)) {
          return [...messagesFromDB, ...messages]
        }
      });
    });
  }

  const handleOpenOverlay = () => {
    overlay.style.display = "flex";
  }

  const handleClose = () => {
    overlay.style.display = 'none';
  }

  const handleInviteUserToChannel = (name, img) => {
    const channelToChange = allPrivateChannelInfo.filter((channel) => channel.channelName.S === channelName).map((channel) => {
      return channel.id.S;
    });
    dynamodb.updateItem({
      TableName: 'ably_channels',
      Key: {
        'id': { S: channelToChange[0] },
      },
      UpdateExpression: 'ADD channelMembers :channelMembers, channelMembersImg :channelMembersImg',
      ExpressionAttributeValues: {
        ':channelMembers': { SS: [name] },
        ':channelMembersImg': { SS: [img] },
      },
      ReturnValues: 'ALL_NEW',
    }, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success MSG: ', data);
      }
    });
    overlay.style.display = "none";
  }

  useEffect( () => {
    addRegisteredUsers();
    saveUserToDB();
    queryDirectMsgsWithPartiQL();
  }, [registeredUsers.length]);

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  });

  useEffect(() => {
    setTimeout(() => { setDirectMessagesInfoFromDB(queryDirectMsgsWithPartiQL()); }, 50);
  }, [tempMessages.length]);

  return (
    // console.log('directMessageChannels: ', directMessageChannels),
    // console.log('DiectMessages: ', directMessagesInfoFromDB),
    // console.log('saveDirectMessageToDB: ', directMessagesInfoFromDB),
    // console.log('privateChannels: ', privateChannels),
    // console.log('temp: ', tempMessages),
    <>
      <div className={styles.mainContainer}>
      <div id="overlay2" className={styles.overlay}>
      <p className={styles.replyAuthor}>Reply to message from: {replyToAuthor}</p>
      <div className={styles.reply}>{replyMessage}</div>
        <div className={styles.editor2}>
          <form
            id="chat-form2" 
            onSubmit={handleFormSubmission} 
            className={styles.form}
            >
            <Editor
                    apiKey={process.env.TINY_MCE_API_KEY}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") {
                        e.preventDefault();
                        sendChatMessage(messageText, replyMessage);
                        overlay2.style.display = 'none';
                        form2.reset();
                      }
                    }}
                    init={{
                      height: 200,
                      placeholder: "Type reply here...",
                      menubar: false,
                      resize: false,
                      plugins: [
                        'emoticons',
                        'insertdatetime',
                        'link',
                        'lists',
                        'table',
                        'image',
                        'code'
                      ],
                      toolbar:
                        'undo redo | formatselect | bold italic backcolor | \
                        emoticons | link | code |  removeformat \ '
                    }}
                    onEditorChange={(content, editor) => {
                      return (
                      getPresenceTyping(content),
                      typingIndicator(content),
                      setMessageText(content)
                      )
                    }}
                  />
                  <button type="submit" className={styles.button}>Send</button>
            </form>
        </div>  
      <div>
      </div><button onClick={handleReplyClose} style={{ color: "white"}}>X CLOSE</button></div>
        <div className={styles.chatUserContainer}>
          <p className={styles.chatTitle}>DM Online Members</p>
          <div className={styles.chatUser}>{ getUniqueMembers(1) }</div>
        </div>
      <div className={styles.privateChannelsUserListContainer}>  
          {getUniqueMembers(3).map((member, i) => {
            return member.channelMembersImg.SS.map((memberImg) => {
            return (
              <div key={`${uuidv4()}=PrivateMember+${i}`} className={styles.privateChannelsUserList}>
                <img src={memberImg} width={40} height={40} className={styles.channelMemberImg} />
              </div>
            )});
          })}
        </div>
        <h1 className={styles.channelHeading}>"{channelName}"{Array.isArray(privateChannels) && privateChannels.includes(channelName) ? <span className={styles.plusBtn} onClick={handleOpenOverlay}>👤+</span> 
        : null}
        </h1>
        <div id="overlay" className={styles.overlay}><div>{getUniqueMembers(2)}</div><button onClick={handleClose}>X</button></div>
      <div className={styles.channelsContainer}>
      <div className={styles.channels}>
      <span className={styles.channelTitle}>PUBLIC</span>
      {channels.map((channel, index) => 
      <span key={`${index}=Public`}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      )}
      <br/>
      <hr width={140} style={{ marginBottom: "10px" }}/>
      <div className={styles.createChannel}>
          <input 
          className={styles.createChannelInput}
          id="create-channel" 
          type="text" 
          placeholder="Type Private Name"
          maxLength={14}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              createChannel();
              setValue("");
            }
          }}
          />
          <button className={styles.newChannelButton} onClick={createChannel}>Create Channel</button>
        </div>
        <hr width={140}/>
      <span className={styles.channelTitle}>PRIVATE</span>
      {Array.isArray(privateChannels) ? privateChannels.map((channel, index) => 
      <span key={`${index}=Private`}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      ): <span></span>}
      <br/>
      <span className={styles.channelTitle}>MESSAGES</span>
      {Array.isArray(directMessageChannels) && directMessageChannels.length ? directMessageChannels.map((pMsg, index) => 
        pMsg !== session.user.name ? 
        <span key={`${index}=PrivMessages`}>
          <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
          <span className={styles.hashTag}>#</span>
            {pMsg}
          </p>
        </span> : null
      ): null}
      </div>
      </div>
      <center className={styles.chatCenter}>
        <div className={styles.chatHolder}>
          <div className={styles.chatText}>
            {parsedMessages}
            <div ref={(element) => { messageEnd = element; }}></div> 
          </div>
        </div>
      </center>
     
      <center className={styles.editorContainer}>
        <div className={styles.editor}>
          <form
            id="chat-form" 
            onSubmit={handleFormSubmission} 
            className={styles.form}
            >
            <Editor
                    apiKey={process.env.TINY_MCE_API_KEY}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") {
                        e.preventDefault();
                        sendChatMessage(messageText);
                        form.reset();
                      }
                    }}
                    init={{
                      height: 200,
                      placeholder: "Type your message here...",
                      menubar: false,
                      resize: false,
                      plugins: [
                        'emoticons',
                        'insertdatetime',
                        'link',
                        'lists',
                        'table',
                        'image',
                        'code'
                      ],
                      toolbar:
                        'undo redo | formatselect | bold italic backcolor | \
                        emoticons | link | code |  removeformat \ '
                    }}
                    onEditorChange={(content, editor) => {
                      return (
                      getPresenceTyping(content),
                      typingIndicator(content),
                      setMessageText(content)
                      )
                    }}
                  />
                  <button type="submit" className={styles.button}>Send</button>
            </form>
            </div>
          </center>
        </div>
    </>
  )
}

export default AblyChatComponent;