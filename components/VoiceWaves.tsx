"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import * as THREE from "three";
import { Conversation } from "@11labs/client";
import { useMessages } from "@/contexts/MessagesContext";
import { Message } from "@/types";
import { v4 as uuidv4 } from "uuid";

import { motion } from "framer-motion";
import { Icons } from "./ui/icons";

extend(THREE);

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  
  varying vec2 vUv;
  
  //	Classic Perlin 3D Noise 
  //	by Stefan Gustavson
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  
  float noise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }

  void main() {
    // Create circular mask with crisp edges
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    // Very thin smooth border for antialiasing
    float radius = 0.25;
    float smoothEdge = 0.001; // Much smaller value for sharper edge
    float alpha = 1.0 - smoothstep(radius - smoothEdge, radius + smoothEdge, dist);
    
    if (dist > radius + smoothEdge) {
      discard;
    }
    
    float n = noise(vec3(vUv * 3.0, uTime * 0.5));
    vec3 color = mix(uColorA, uColorB, n * 0.5 + 0.5);
    gl_FragColor = vec4(color, alpha);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function GradientBackground() {
  const meshRef = useRef();
  const materialRef = useRef();
  const { clock } = useThree();

  useFrame(() => {
    if (materialRef.current) {
      // @ts-expect-error idc rn
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color("#ff9a9e").convertSRGBToLinear() },
    uColorB: { value: new THREE.Color("#57c84d").convertSRGBToLinear() },
  };

  return (
    // @ts-expect-error idc rn
    <mesh ref={meshRef} scale={[4, 4, 1]}>
      <planeGeometry args={[2, 2, 128, 128]} />{" "}
      {/* Increased geometry resolution */}
      <shaderMaterial
        // @ts-expect-error idc rn
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function VoiceVisualization() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { addMessage } = useMessages();

  async function requestMicrophonePermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  async function getSignedUrl(): Promise<string> {
    const response = await fetch("/api/signed-url");
    if (!response.ok) {
      throw Error("Failed to get signed url");
    }
    const data = await response.json();
    return data.signedUrl;
  }

  async function startConversation() {
    setIsConnecting(true);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("No permission");
      setIsConnecting(false);
      return;
    }
    const signedUrl = await getSignedUrl();
    const conv = await Conversation.startSession({
      signedUrl: signedUrl,
      preferHeadphonesForIosDevices: true,
      onConnect: () => {
        setIsConnected(true);
        setIsSpeaking(true);
        setIsConnecting(false);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsSpeaking(false);
      },
      clientTools: {
        addArtifactToConversation: async (data: { message: Message }) => {
          console.log("adding artifact:", data);
          if (data.message.type === "tweet") {
            addMessage({
              ...data.message,
              id: uuidv4(),
              type: "tweet",
              content: data.message.content || "",
              label: data.message.label || "Assistant",
              timestamp: Date.now(),
            });
          } else if (data.message.type === "image") {
            addMessage({
              id: uuidv4(),
              type: "image",
              content: data.message.content || "",
              label: data.message.label || "Assistant",
              timestamp: Date.now(),
              imageUrl: data.message.imageUrl || "",
            });
          } else if (data.message.type === "regular") {
            addMessage({
              ...data.message,
              id: uuidv4(),
              type: "regular",
              content: data.message.content || "",
              label: data.message.label || "Assistant",
              timestamp: Date.now(),
            });
          }
        },
      },
      onError: (error) => {
        console.log(error);
        alert("An error occurred during the conversation");
        setIsConnecting(false);
      },
      onModeChange: ({ mode }) => {
        setIsSpeaking(mode === "speaking");
      },
      onMessage: (message) => {
        console.log(message);
      },
    });
    setConversation(conv);
  }

  async function endConversation() {
    if (!conversation) {
      return;
    }
    await conversation.endSession();
    setConversation(null);
  }

  return (
    <div className="relative w-[500px] h-[500px] rounded-full">
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <Canvas>
          <GradientBackground />
        </Canvas>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Button
            onClick={isConnected ? endConversation : startConversation}
            variant="secondary"
            disabled={isConnecting}
            className={`
              px-6 py-2 gap-2 rounded-full bg-white/90 hover:bg-white 
              transition-all duration-300 shadow-lg
              ${isConnected ? "text-red-500" : "text-zinc-800"}
            `}
          >
            {isConnecting ? (
              <Icons.spinner />
            ) : isConnected ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "End Conversation"
              : "Start Conversation"}
          </Button>
        </motion.div>
        <div className="text-white text-sm">
          {isConnected ? (
            <p>Agent is {isSpeaking ? "speaking" : "listening"}</p>
          ) : (
            <p>Disconnected</p>
          )}
        </div>
      </div>
    </div>
  );
}
