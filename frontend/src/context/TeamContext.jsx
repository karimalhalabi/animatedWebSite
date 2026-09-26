import { useEffect, useState } from "react";
import { TeamContext } from "./teamStore";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { request } from "../utils/helpers";
const socket = io({ autoConnect: false, transports: ["websocket", "polling"] });
export function TeamProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [connected, setConnected] = useState(false),
    [demo, setDemo] = useState(false);
  const [members, setMembers] = useState([]),
    [conversations, setConversations] = useState([]),
    [presence, setPresence] = useState({ onlineIds: [], rooms: {} }),
    [activity, setActivity] = useState({}),
    [iceServers, setIceServers] = useState([]),
    [invitations, setInvitations] = useState([]);
  function applySession(data) {
    setUser(data.user);
    setDemo(data.demo);
    setIceServers(data.iceServers);
    sessionStorage.setItem("liqaToken", data.token);
  }
  useEffect(() => {
    let mounted = true;
    async function connect() {
      setConnected(true);
      const token = sessionStorage.getItem("liqaToken");
      try {
        if (token)
          applySession(await request(socket, "auth:resume", { token }));
        else if (!sessionStorage.getItem("liqaSignedOut"))
          applySession(await request(socket, "auth:demo"));
      } catch {
        sessionStorage.removeItem("liqaToken");
        setUser(null);
      } finally {
        if (mounted) setReady(true);
      }
    }
    const disconnect = (reason) => {
      if (reason === "io server disconnect") {
        sessionStorage.removeItem("liqaToken");
        sessionStorage.setItem("liqaSignedOut", "true");
        setUser(null);
        socket.connect();
      }
      setConnected(false);
      setPresence({ onlineIds: [], rooms: {} });
      setActivity({});
    };
    const workspace = (data) => {
      setMembers(data.members);
      setConversations(data.conversations);
    };
    const invite = (data) => {
      setInvitations((old) => [data, ...old]);
      toast(`${data.from.name} يدعوك لمحادثة خاصة`, {
        icon: "📹",
        duration: 6000,
      });
    };
    socket.on("connect", connect);
    socket.on("disconnect", disconnect);
    socket.on("workspace:update", workspace);
    socket.on("presence:update", setPresence);
    socket.on("admin:activity", setActivity);
    socket.on("private:invitation", invite);
    socket.on("connect_error", () => {
      setConnected(false);
      setReady(true);
    });
    socket.connect();
    return () => {
      mounted = false;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);
  async function login(email, password) {
    const data = await request(socket, "auth:login", { email, password });
    applySession(data);
    sessionStorage.removeItem("liqaSignedOut");
    toast.success("أهلاً بك في لقاء");
  }
  async function loginDemo() {
    applySession(await request(socket, "auth:demo"));
    sessionStorage.removeItem("liqaSignedOut");
  }
  async function logout() {
    await request(socket, "auth:logout", {
      token: sessionStorage.getItem("liqaToken"),
    });
    sessionStorage.removeItem("liqaToken");
    sessionStorage.setItem("liqaSignedOut", "true");
    setUser(null);
    setActivity({});
    setMembers([]);
    setConversations([]);
    setInvitations([]);
  }
  const call = (event, data) => request(socket, event, data);
  return (
    <TeamContext.Provider
      value={{
        socket,
        user,
        ready,
        connected,
        demo,
        members,
        conversations,
        presence,
        activity,
        iceServers,
        invitations,
        setInvitations,
        login,
        loginDemo,
        logout,
        call,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
