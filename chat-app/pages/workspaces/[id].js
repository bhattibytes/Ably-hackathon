import React, { useState, useEffect } from 'react';
import styles from '../../styles/Kaban.module.css';
import Kanban from '../../components/Kanban';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AWS from 'aws-sdk';
import ResponsiveAppBar from '../../components/ResponsiveAppBar';
import { v4 as uuidv4 } from 'uuid';
import { SpaceContextProvider, LeaveSpace } from "../../utils/SpacesContext";

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

// sample data generator
const getItems = (count, offset = 0) =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k + offset}-${new Date().getTime()}`,
    content: `Task #${k + offset}`
}));

export default function Workspaces() {
  const router = useRouter();
  const [state, setState] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [kanbanId, setKanbanId] = useState('');

  // New state variable to store channel information
  const [channels, setChannels] = useState([]);
  const { data: session } = useSession(); // Assuming you're using next-auth to get the user session
  const [channelName, setChannelName] = useState('SAMPLE');
  const [refreshWorkspace, setRefreshWorkspace] = useState(false);
  

  const handleRefreshWorkspace = () => {
    setRefreshWorkspace(!refreshWorkspace);
  };
  

  const fetchDataFromDynamoDB = async (itemId) => {
    const statement = 'SELECT * FROM "ably_kanban"';
    try {
      const kanbanData = await dynamodb.executeStatement({ Statement: statement }).promise();
      
      if (kanbanData.Items && kanbanData.Items.length > 0) {
        const foundItem = kanbanData.Items.find(item => item.channelName && item.channelName.S === itemId);
        
        if (foundItem) {
          const { state, headers, itemCount, id } = foundItem;
          const parsedState = JSON.parse(state.S);
          const parsedHeaders = headers.SS;
          setState(parsedState);
          setKanbanId(id.S);
          
          setHeaders(parsedHeaders);
          setItemCount(parseInt(itemCount.N));
          setIsLoading(false);
          setDataFetched(true);
        } else {  
          console.log('Item not found in DynamoDB');
          setDataFetched(false);
          setIsLoading(false);
        }
      } else {
        console.log('No items found in DynamoDB');
        setDataFetched(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching Kanban info:', error);
    }
  };
  
  
  const insertItemToDynamoDB = async () => {
    
    const targetChannel = channels.find(channel => channel.channelName.S === router.query.id);
  
    if (targetChannel) {
      const { channelName, channelOwner, id, ownerName, channelMembers, channelMembersImg, timestamp, connectionId } = targetChannel;
  
      const initialState = [getItems(5), getItems(5, 5), getItems(5, 10), getItems(5, 15)];
      const initialHeaders = ['Backlog', 'To Do', 'In Progress', 'Done'];
      const count = 20;
  
      try {
        const params = {
          TableName: 'ably_kanban',
          Item: {
            'id': { S: uuidv4() },
            'state': { S: JSON.stringify(initialState) },
            'headers': { SS: initialHeaders },
            'itemCount': { N: count.toString() },
            'channelOwner': { S: channelOwner.S },
            'ownerName': { S: ownerName.S },
            'channelName': { S: channelName.S },
            'timestamp': { S: timestamp.S },
            'connectionId': { S: connectionId.S },
            'channelMembers': { SS: channelMembers.SS },
            'channelMembersImg': { SS: channelMembersImg.SS },
          },
        };
  
        dynamodb.putItem(params, function(err, data) {
          if (err) {
            console.error('Error inserting item into DynamoDB:', err);
          } else {
            console.log('Item inserted into DynamoDB:', params.Item);
            fetchDataFromDynamoDB(router.query.id);
          }
        });
      } catch (error) {
        console.error('Error preparing item for DynamoDB:', error);
      }
    } else {
      console.error('Channel not found for router.query.id:', router.query.id);
    }
  };
  

  // Fetch channel information from DynamoDB
  const fetchChannelInfo = async () => {
    if (session) {
      const statement = 'SELECT * FROM "ably_channels"';
      try {
        const channelData = await dynamodb.executeStatement({ Statement: statement }).promise();
        const userChannels = channelData.Items.filter(item => item.channelMembers.SS.includes(session.user.name));
        setChannels(userChannels);
      } catch (error) {
        console.error('Error fetching channel info:', error);
      }
    }
  }

  const fetchKanbanData = async () => {
    if (router.query.id) {
      fetchDataFromDynamoDB(router.query.id);
    }
  };

  const navigateToWorkspace = (channelName) => {
    setChannelName(channelName.toUpperCase());
    router.push(`/workspaces/${channelName}`);
    setDataFetched(false);
    setIsLoading(true);
    setHeaders([]);
    setState([]);
    fetchChannelInfo();
  }
  
  useEffect(() => {
    fetchChannelInfo();
  }, [session, dataFetched, refreshWorkspace]);
  
  useEffect(() => {
    if (router.query.id) {
      fetchDataFromDynamoDB(router.query.id);
    }
  }, [router.query.id, refreshWorkspace]);
  

  

  return (
    <>
    <SpaceContextProvider>
    <ResponsiveAppBar/>
    
    <div className="flex gap-4">
      <div className="p-3 w-1/6 bg-track-blue my-4 rounded-2xl h-screen">
        <h1 className=" text-white font-bold text-2xl mt-20 text-center mb-2 underline">WORKSPACES</h1>
        <ul>
          {channels.map(channel => (
            <li
            key={channel.channelName.S}
            className='bg-track-blue cursor-pointer hover:underline text-white mb-2  pl-3 rounded-xl text-xl font-semibold'
            onClick={() => navigateToWorkspace(channel.channelName.S)} // Wrap in a function
          >
           <span className='text-track-green mr-2'>#</span> {channel.channelName.S}
          </li>
          ))}
        </ul>
      </div>
      <div className="w-5/6 mt-24">
        {isLoading ? (
          <p>Loading...</p>
        ) : dataFetched ? (
          <>
            <h1 className="text-center uppercase font-bold text-4xl underline text-track-blue ">{channelName}</h1>
            <Kanban s={state} h={headers} ic={itemCount} id={kanbanId} refreshWorkspace={refreshWorkspace} setRefreshWorkspace={setRefreshWorkspace}/>
          </>
        ) : (
          <div className=' rounded-2xl m-6 mt-20 flex text-center justify-center items-center h-[70vh] flex-col gap-6'>
            <p className='text-4xl'>Create a kanban board for "<span className='font-bold'>{router.query.id}</span>  "</p>
            <button onClick={insertItemToDynamoDB} className='text-3xl font-medium hover:underline cursor-pointer rounded-2xl px-4 py-2 pb-3  bg-track-blue text-white'>Create</button>

          </div>
        )}
      </div>
    </div>
    </SpaceContextProvider>
    </>
    
  );
}
