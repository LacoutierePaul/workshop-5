import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import {NodeState, Value} from "../types";
import {delay} from "../utils";
import {error} from "console";

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

  let currentNodeState : NodeState ={
    killed: false,
    x: initialValue,
    decided: false,
    k: null,
  }
  let proposals : Map<number, number[]> = new Map(); //maybe nodestate
  let votes : Map<number, number[]> = new Map();


  // Route to check node status
  node.get("/status", (req, res) => {
    if (isFaulty) {
      res.status(500).send("faulty");
    } else {
      res.status(200).send("live");
    }
  });

  // Route to receive messages
  node.post("/message", async (req, res) => {
    let { k, x, messageType } = req.body;
    if(!isFaulty) {
      if (messageType == "propose") {
        proposals.set(k, x);
        let proposal = proposals.get(k);
        while (!proposal || proposal.length < (N - F)) {
          await delay(5);
          proposal = proposals.get(k);
        }
        //we check if we received more than n/2 votes for the same value
        let count0 = 0;
        let count1 = 0;
        for (let i = 0; i < proposal.length; i++) {
          if (proposal[i] == 0) {
            count0++;
          } else {
            count1++;
          }
        }
        if (count0 > (N - F) / 2) {
          currentNodeState.x = 0;
        } else if (count1 > (N - F) / 2) {
          currentNodeState.x = 1;
        } else {
          currentNodeState.x = "?";
        }
        //we send the result to all the nodes
        for (let i = 0; i < N; i++) {
          if (i != nodeId) {
            error("vote send to ", i, "from", nodeId)

            fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({k: currentNodeState.k, x: currentNodeState.x, messageType: "vote"}),
            });
          }

        }
      }
      if (messageType == "vote") {
        votes.set(k, x);
        if (votes.has(k)) {
          let vote = votes.get(k);
          while (!vote || vote.length < (N - F)) {
            await delay(5);
            vote = votes.get(k);
          }
          let count0 = 0;
          let count1 = 0;
          for (let i = 0; i < vote.length; i++) {
            if (vote[i] == 0) {
              count0++;
            } else {
              count1++;
            }
          }
          if (count0 > F + 1) {
            currentNodeState.x = 0;
            currentNodeState.decided = true;
          } else if (count1 > F + 1) {
            currentNodeState.x = 1;
            currentNodeState.decided = true;
          } else {
            if (count0 > 1) {
              currentNodeState.x = 0;
            } else if (count1 > 1) {
              currentNodeState.x = 1;
            }
            //on prend un random entre 0 et 1 pour la nouvelle valeur du state
            else {
                currentNodeState.x =  Math.round(Math.random()) as 0 | 1;
            }
            //send nes messages
            for (let i = 0; i < N; i++) {
              if (i != nodeId) {
                error("message send to ", i, "from", nodeId)
                fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({k: currentNodeState.k, x: currentNodeState.x, messageType: "propose"}),
                });
              }
            }

          }
        }
      }
    }
  });


  // Route to start the consensus algorithm
  node.get("/start", async (req, res) => {
    error("actual node : ", nodeId)
    while(!nodesAreReady()){
      await delay(5);
    }
    error("nodes are ready")
    error("node", nodeId, "is faulty", isFaulty)
    if(!isFaulty) {
      error("node", nodeId, "is not faulty")
      currentNodeState.k = 1;
      for (let i = 0; i < N; i++) {
        if (i != nodeId) {
          error("message send to ", i, "from", nodeId)
          fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({k: currentNodeState.k, x: currentNodeState.x, messageType: "propose"}),
          });
        }
      }
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




  // Start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(`Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`);
    setNodeIsReady(nodeId);
  });

  return server;
}
