import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "../styles/Kaban.module.css";
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import ResponsiveAppBar from "./ResponsiveAppBar";
import React, { useMemo,useState , useRef, useEffect, useContext } from "react";
import { mockNames } from "../utils/mockNames";
import { colours } from "../utils/helper";
import useSpaceMembers from "../utils/useMembers";
import { MemberCursors, YourCursor } from "../utils/Cursors";
import { SpacesContext } from "../utils/SpacesContext";
import { LockFilledSvg } from "../utils/lockFilledSVG";
import { useSession } from 'next-auth/react';
import { useOnClickOutside } from "usehooks-ts";
 


AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

const mockName = () => mockNames[Math.floor(Math.random() * mockNames.length)];


// fake data generator
const getItems = (count, offset = 0) =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k + offset}-${new Date().getTime()}`,
    content: `Task #${k + offset}`
  }));

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};
const grid = 4;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  borderRadius: "5px",
  boxShadow: `inset 0 0 10px`,

  // change background colour if dragging
  background: isDragging ? "#5BE9B9" : "grey",

  // styles we need to apply on draggables
  ...draggableStyle
});
const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? "#6e07f3" : "#defaf1",
  padding: grid,
  width: 150,
  height: 620,
  overflow: "scroll",
  marginTop: "50px"
});

export default function Kanban({ id, s, h, ic }) {
  const [state, setState] = useState([]);
  const [value, setValue] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [headers, setHeaders] = useState([]);
  const [task , setTask] = useState('');
  const [itemCount, setItemCount] = useState(null);
  const refLock = useRef(null);
  const [lockedIdByYou, setLockedIdByYou] = useState(null);
  const [myLock, setMyLock] = useState([]);
  const [otherLocks, setOthersLocks] = useState([]);
  const name = useMemo(mockName, []);
  const { data: session, status } = useSession();
  /** 💡 Select a color to assign randomly to a new user that enters the space💡 */
  const userColors = useMemo(
    () => colours[Math.floor(Math.random() * colours.length)],
    []
  );

  /** 💡 Get a handle on a space instance 💡 */
  const space = useContext(SpacesContext);

  useEffect(() => {
    const name = session?.user.name;
    space?.enter({ name, userColors });

    const my = space?.locks.getSelf();
      my.then((array) => {
        setMyLock(array)
      });
      const others = space?.locks.getOthers();
      others.then((array) => {
        setOthersLocks(array);
      });   

  }, [space]);

  useEffect(() => {
    if (!space) return;

    const handler = () => {
      const my = space?.locks.getSelf();
      my.then((array) => {
        setMyLock(array)
      });
      const others = space?.locks.getOthers();
      others.then((array) => {
        setOthersLocks(array);
      });   
    };

    // Listen to all lock events
    space.locks.subscribe("update", handler);
    
    return () => {
      // Remove listener on unmount
      space?.locks.unsubscribe("update", handler);
    };
  }, [space]);


  const { self, otherMembers } = useSpaceMembers(space);


  const liveCursors = useRef(null);


  
  useEffect(() => {
      updateItemToDynamoDB(id);
  }, [state, headers, itemCount]); 


  const updateItemToDynamoDB = (itemId) => {
    if (itemCount === null) {
      return;
    }
  try {
    

    const params = {
      TableName: 'ably_kanban',
      Key: {
        id: { S: itemId }, 
      },
      UpdateExpression: 'SET #state = :newState, #headers = :newHeaders, #itemCount = :newItemCount',
      ExpressionAttributeNames: {
        '#state': 'state',
        '#headers': 'headers',
        '#itemCount': 'itemCount',
      },
      ExpressionAttributeValues: {
        ':newState': { S: JSON.stringify(state) }, 
        ':newHeaders': { SS: headers }, 
        ':newItemCount': { N: itemCount.toString() }, 
      },
      ReturnValues: 'ALL_NEW', 
    };

    dynamodb.updateItem(params, function (err, data) {
      if (err) {
        console.error('Error updating item in DynamoDB:', err);
      } else {
        console.log('Item updated in DynamoDB:', data.Attributes);
      }
    });
  } catch (error) {
    console.error('Error preparing item for DynamoDB update:', error);
  }
};

  function onDragEnd(result) {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }
    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(state[sInd], source.index, destination.index);
      const newState = [...state];
      newState[sInd] = items;
      setState(newState);
    } else {
      const result = move(state[sInd], state[dInd], source, destination);
      const newState = [...state];
      newState[sInd] = result[sInd];
      newState[dInd] = result[dInd];

      setState(newState.filter(group => {
        if (group.length === 0) {
          const newHeaders = [...headers];
          newHeaders.splice(sInd, 1);
          setHeaders(newHeaders);
        }
        return group.length
      }));
    }
  }

  const handleUpdateHeader = (e) => {
    let input = document.getElementById(`${e.target.id}-input`);

    if (input.style.display === "none") {
      input.style.display = "";
    } else {
      input.style.display = "none";
    }
   
    if (headerValue === "") {
      return;
    }

    if (headers.includes(headerValue)) {
      alert("Column name already exists");
      input.style.display = "none";
      setHeaderValue("");
      return;
    }

    let header = e.target.innerHTML;
    const newHeaders = [...headers];
    const index = newHeaders.indexOf(header);
    
    newHeaders.splice(index, 1, headerValue);
    setHeaders(newHeaders);
    if (headerValue !== "") {
      setHeaderValue("");
    }
  };

  const handleKeyDownHeaderEdit = (e) => {
    if (e.key === "Enter") {
      if (headers.includes(headerValue)) {
        alert("Column name already exists");
        setHeaderValue("");
        return;
      } else {
        setTask(e.target.value)
      
      let input = document.getElementById(`${e.target.id}`);
      input.style.display = "none";

      let header = input.id.split("-")[0];
      const newHeaders = [...headers];
      const index = newHeaders.indexOf(header);
      
      newHeaders.splice(index, 1, headerValue);
      setHeaders(newHeaders);
      if (headerValue !== "") {
        setHeaderValue("");
        
      }
    }
  }
  }

  const handleClickOutside = (e) => {

  
    if (lockedIdByYou){
      space?.locks.release(lockedIdByYou);
      console.log("released lock by id",lockedIdByYou);
      setLockedIdByYou(null);
      const closeInputs = document.querySelectorAll("input[id$=input]");
    closeInputs.forEach((input) => {
      if (input.style.display === "") {
        input.style.display = "none";
      }
    });
    }
  };

  // useOnClickOutside(refLock, handleClickOutside);

  const handleClickEditTaskTitle = (e) => {
    try {
      // Check if you have already acquired a lock for the item
      if (lockedIdByYou) {
        // If so, release the existing lock
        space?.locks.release(lockedIdByYou);
        console.log("Released lock by id", lockedIdByYou);
        setLockedIdByYou(null);
      }
  
      // Now, acquire the lock for the new item
      space.locks.acquire(e.target.id);
      setLockedIdByYou(e.target.id);
      console.log("Acquired lock by id", e.target.id);
    } catch (error) {
      console.error("Failed to acquire or release the lock:", error);
      // Handle the error, e.g., displaying an error message to the user.
    }

    const closeInputs = document.querySelectorAll("input[id$=input]");
    closeInputs.forEach((input) => {
      if (input.style.display === "") {
        input.style.display = "none";
      }
    });
    
    const inputId = `${e.target.id}=input`;
    const taskElementId = `${e.target.id}=task`;
  
    const input = document.getElementById(inputId);
    const taskElement = document.getElementById(taskElementId);
   
    input.style.display = input.style.display === "none" ? "" : "none";
  
    const id = e.target.id;
    if (task !== "") {
      const newState = state.map((row) =>
        row.map((item) => {
          if (item.id === id) {
            return { ...item, content: task };
          }
          return item;
        })
      );
      setState(newState);
      taskElement.innerHTML = task;
      setTask("");
      if (lockedIdByYou){
        space?.locks.release(lockedIdByYou);
        console.log("released lock by id",lockedIdByYou);
        setLockedIdByYou(null);
      }
      input.style.display = "none";
    }
  };
  
  // after,I edit task title click Enter, the state is not updated; check later
  const handleKeyDownEditTaskTitle = (e) => {
    if (e.key === "Enter") {
      let taskElement = document.getElementById(`${e.target.id.split('=')[0]}=task`);
      let taskInput = document.getElementById(`${e.target.id}`);
  
      if (!taskInput) return; 
  
      e.target.style.display = "none";
      const newTaskTitle = taskInput.value; 
  
      const newState = [...state];
      const id = e.target.id;
  
      for (let i = 0; i < newState.length; i++) {
        for (let j = 0; j < newState[i].length; j++) {
          if (newState[i][j].id === id) {
            newState[i][j].content = newTaskTitle; 
            setState(newState);
          }
        }
      }
  
      taskElement.innerHTML = newTaskTitle;
      if (lockedIdByYou){
        space?.locks.release(lockedIdByYou);
        console.log("released lock by id",lockedIdByYou);
        setLockedIdByYou(null);
      }
      taskInput.value = ""; 
      setTask("");
    }
  };
  
  // useEffect(() => {
  //   setState([getItems(10), getItems(10, 10), getItems(10, 20), getItems(10, 30)]);
  //   setHeaders(["Click to Edit 1", "Click to Edit 2", "Click to Edit 3", "Click to Edit 4"]);
  // }, []);
  
  useEffect(() => {
    setState(s);
    setHeaders(h);
    setItemCount(ic);
  }, []);

  return (
    <>
    <div
        id="live-cursors"
        ref={liveCursors}
        className="live-cursors-container relative example-container"
      >
        <YourCursor
          self={self}
          space={space}
          parentRef={liveCursors}
        />
        <MemberCursors
          otherUsers={
            otherMembers.filter((m) => m.isConnected)
          }
          space={space}
          selfConnectionId={self?.connectionId}
        />
        <ResponsiveAppBar />
      <div className="pt-32">
        <input 
          className={styles.inputNewGroup}
          type="text" 
          placeholder="Enter New Group Name" 
          maxLength={17}
          id="new-column-name" 
          onChange={(e) => setValue(e.target.value)} 
          value={value}
        />
        <button
        className={styles.button}
          type="button"
          onClick={() => {
            if (value === "") {
              alert("Please enter name of column");
              return;
            } else if (headers.includes(value)) {
              alert("Column name already exists");
              return;
            } else {
            setHeaders([...headers, value]);
            setState([...state, getItems(1, itemCount)]);
            setItemCount(itemCount + 1);
            setValue("");
            }
          }}
        >
          Add new group
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={() => {
            setState([...state, getItems(1, itemCount)]);
            setHeaders([...headers, `New Group ${itemCount}`]);
            setItemCount(itemCount + 1);
          }}
        >
          Add new item
        </button>
      
        <div className={styles.kanbanBoard}> 
          <DragDropContext onDragEnd={onDragEnd}>
            { state ? state.map((el, ind) => (
              <Droppable key={ind} droppableId={`${ind}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                    {...provided.droppableProps}
                  >  
                  <center style={{ marginLeft: "-160px"}}>            
                  <span className={styles.columnHeader} id={headers[ind]} onClick={(e)=> handleUpdateHeader(e)}>
                    {headers[ind] }
                  </span>
                  </center>
                  <input 
                    type="text" 
                    id={`${headers[ind]}-input`} 
                    key={ind}
                    placeholder={`Edit header title...`}
                    maxLength={17}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    onKeyDown={(e)=> handleKeyDownHeaderEdit(e)} 
                    className={styles.columnHeaderInput}
                    style={{ display: 'none'}}
                    value={headerValue} 
                  />
                   {el.map((item, index) => {
                        let borderColor;
                        let memberName1;

                        const matchingLock = Array.isArray(otherLocks) ? otherLocks.find(lock => lock.id === item.id) : null;
                        const isLocked = !!matchingLock;


                        if (lockedIdByYou === item.id) {
                          borderColor = userColors.cursorColor;
                        }

                        if (matchingLock) {
                          borderColor = matchingLock.member.profileData.userColors.cursorColor;
                          console.log("other border color", borderColor);
                          memberName1 = matchingLock.member.profileData.name;
                        }

                        return (
                          <div>
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div className={`relative border-2 rounded-lg`} style={{ borderColor: borderColor }}>
                                  {matchingLock ? (
                                    <div
                                      className=""
                                      style={{
                                        position: "absolute",
                                        top: "-24px",
                                        right: "6px",
                                        width: "auto",
                                        height: "24px",
                                        padding: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.625rem",
                                        backgroundColor: borderColor,
                                        color: "white",
                                        borderRadius: "4px 4px 0px 0px",
                                        zIndex: 1,
                                        gap: "4px",
                                      }}
                                    >
                                      {memberName1}
                                      <LockFilledSvg className="text-base" />
                                    </div>
                                  ) : lockedIdByYou === item.id ? (
                                    <div
                                      className=""
                                      style={{
                                        position: "absolute",
                                        top: "-24px",
                                        right: "6px",
                                        width: "auto",
                                        height: "24px",
                                        padding: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.625rem",
                                        backgroundColor: userColors.cursorColor,
                                        color: "white",
                                        borderRadius: "4px 4px 0px 0px",
                                        zIndex: 1,
                                        gap: "4px",
                                      }}
                                    >
                                      You
                                      <LockFilledSvg className="text-base" />
                                    </div>
                                  ) : null
                                  }

                                  {isLocked && ( // Add an overlay for locked divs
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        zIndex: 2,
                                        background: "rgba(255, 255, 255, 0.1)", // Transparent overlay
                                      }}
                                    ></div>
                                  )}

                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                  >
                                    <div className={styles.taskCard}>
                                      <span className={styles.taskTitle} id={`${item.id}=task`}>{item.content}</span>
                                      <button
                                        type="button"
                                        className={styles.taskButton}
                                        onClick={(e) => { handleClickEditTaskTitle(e) }}
                                        id={item.id}
                                      >
                                        edit | save
                                      </button>
                                      <button className={styles.taskButtonDelete} type="button" onClick={() => {
                                        var txt = "Are you sure you want to delete this task?";
                                        if (confirm(txt)) {
                                          console.log("delete");
                                        } else {
                                          return;
                                        }
                                        const newState = [...state];
                                        newState[ind].splice(index, 1);
                                        setState(
                                          newState.filter(group => {
                                            if (group.length === 0) {
                                              const newHeaders = [...headers];
                                              newHeaders.splice(ind, 1);
                                              setHeaders(newHeaders);
                                            }
                                            return group.length;
                                          })
                                        );
                                      }}>
                                        delete
                                      </button>
                                      <input
                                        type="text"
                                        id={`${item.id}=input`}
                                        key={ind}
                                        style={{ display: 'none' }}
                                        placeholder={`Edit task title ${item.id.split('-')[1]}`}
                                        className={styles.taskInput}
                                        onKeyDown={(e) => handleKeyDownEditTaskTitle(e)}
                                        value={task}
                                        onChange={(e) => { setTask(e.target.value) }}
                                      />
                                      <span className={styles.id}>id: {item.id.split('-')[1]}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          </div>
                        );
                      })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )): null }
          </DragDropContext>
        </div>
      </div>
    </div>
      
    </>
  );
}



