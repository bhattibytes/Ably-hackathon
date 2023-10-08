import React, { useState, useEffect } from 'react';
import styles from '../../styles/Kaban.module.css';
import Kanban from '../../components/Kanban';
import { useRouter } from 'next/router';
import AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

export default function Workspaces() {
  const router = useRouter();
  const { id } = router.query;
  const [state, setState] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const fetchDataFromDynamoDB = (itemId) => {
    try {
      const params = {
        TableName: 'ably_kanban',
        Key: {
          id: { S: itemId },
        },
      };

      dynamodb.getItem(params, function (err, data) {
        if (err) {
          console.error('Error fetching item from DynamoDB:', err);
        } else {
          const { state, headers, itemCount } = data.Item;
          const parsedState = JSON.parse(state.S);
          const parsedHeaders = JSON.parse(headers.S);
          setState(parsedState);
          setHeaders(parsedHeaders);
          setItemCount(parseInt(itemCount.N));
          setIsLoading(false); 
        }
      });
    } catch (error) {
      console.error('Error preparing item for DynamoDB fetch:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDataFromDynamoDB(id);
    }
  }, [id]);

  return (
    <>
      <h1 className={styles.heading}>Workspaces</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        id && <Kanban id={id} s={state} h={headers} ic={itemCount} />
      )}
    </>
  );
}
