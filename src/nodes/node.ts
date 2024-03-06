import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { NodeState, Value } from "../types";
import { delay } from "../utils";
import { error } from "console";

export async function node(
    nodeId: number,
    N: number,
    F: number,
    initialValue: Value,
    isFaulty: boolean,
    nodesAreReady: () => boolean,
    setNodeIsReady: (index: number) => void
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  let currentNodeState: NodeState = {
    killed: false,
    x: null,
    decided: null,
    k: null,
  }
  let proposals: number[][] = Array.from({ length: N }, () => []);
  let votes: number[][] = Array.from({ length: N }, () => []);
 // let proposals: Map<number, Value[]> = new Map(); //maybe nodestate
  //let votes: Map<number, Value[]> = new Map();

  // Route to check node status
  node.get("/status", (req, res) => {
    if (isFaulty) {
      res.status(500).send("faulty");
    } else {
      res.status(200).send("live");
    }
  });

  // Route to get the current state of a node
  node.get("/getState", (req, res) => {
    res.status(200).send({
      killed: currentNodeState.killed,
      x: currentNodeState.x,
      decided: currentNodeState.decided,
      k: currentNodeState.k,
    });
  });

  // Route to stop the node
  node.get("/stop", (req, res) => {
    currentNodeState.killed = true;
    res.status(200).send("killed");
  });

  // Route to receive messages
  node.post("/message", async (req, res) => {
    let { k, x, messageType } = req.body;
    if (!isFaulty) {
      if (messageType == "propose") {
        error("node", nodeId, "received propose", x, "actual k ;",k)
        proposals[k].push(x)
        //proposals.set(k, x);
        error("proposals : ",proposals,"actual k ;",k)
        //let proposal = proposals.get(k);
        let proposal = proposals[k];
        error("N-F: ",N-F,"proposal length : ",proposal.length,"actual k ;",k)
       if(proposal.length >= (N - F)) {
         error("node", nodeId, "proposed", proposal, "actual k ;", k, "length : ", proposal.length,)
         let count0 = 0;
         let count1 = 0;
         for (let i = 0; i < proposal.length; i++) {
           if (proposal[i] == 0) {
             count0++;
           } else if (proposal[i] == 1) {
             count1++;
           }
         }
         if (count0 > (N - F) / 2) {
           x = 0;
         } else if (count1 > (N - F) / 2) {
           x = 1;
         } else {
           x = "?";
         }
         error("node", nodeId, "proposed", currentNodeState.x, "actual k ;", k)
         for (let i = 0; i < N; i++) {
           error("vote send to ", i, "from", nodeId, "actual k ;", k)
           fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({k: k, x: x, messageType: "vote"}),
           });
         }
       }
      }
      else if (messageType == "vote") {
      //  votes.set(k, x);
        votes[k].push(x)
          let vote = votes[k];
         if( vote.length >= (N - F)) {
          let count0 = 0;
          let count1 = 0;
          for (let i = 0; i < vote.length; i++) {
            if (vote[i] == 0) {
              count0++;
            } else if (vote[i] == 1){
              count1++;
            }
          }
          if (count0 >= F + 1) {
            currentNodeState.x = 0;
            currentNodeState.decided = true;
            error("node", nodeId, "decided", currentNodeState.x)
          } else if (count1 >= F + 1) {
            currentNodeState.x = 1;
            currentNodeState.decided = true;
            error("node", nodeId, "decided", currentNodeState.x)
          } else {
            if (count0 > 1) {
              currentNodeState.x = 0;
            } else if (count1 > 1) {
              currentNodeState.x = 1;
            } else {
              currentNodeState.x = Math.round(Math.random()) as 0 | 1;
            }
            currentNodeState.k=k+1;

            for (let i = 0; i < N; i++) {
                error("message send to ", i, "from", nodeId, "actual k ;",k)
                fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ k: currentNodeState.k, x: currentNodeState.x, messageType: "propose" }),
                });
            }
          }
        }
      }
    }
    res.status(200).send("Message received and processed.");
  });

  // Route to start the consensus algorithm
  node.get("/start", async (req, res) => {
      while (!nodesAreReady()) {
        await delay(5);
      }
        if (!isFaulty) {
          currentNodeState.k = 1;
          currentNodeState.x = initialValue;
          currentNodeState.decided = false;
          error("Hello")

          for (let i = 0; i < N; i++) {
            error("message send to ", i, "from", nodeId, "actual k ;",currentNodeState.k)
            fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({k: currentNodeState.k, x: currentNodeState.x, messageType: "propose"}),
            });
          }
        }
        else {
          currentNodeState.decided = null;
          currentNodeState.x = null;
          currentNodeState.k = null;
        }
        res.status(200).send("Consensus algorithm started.");
  });

  // Start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(`Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`);
    setNodeIsReady(nodeId);
  });

  return server;
}
