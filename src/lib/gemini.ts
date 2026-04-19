import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface ScenePrompt {
  scene: string;
  image_to_image: {
    subject: string;
    camera_view: string;
    lighting: string;
    lens: string;
    style_tags: string;
    first_frame_prompt: string;
    last_frame_prompt: string;
  };
  image_to_video: {
    subject: string;
    camera_view: string;
    camera_movement: string;
    lighting: string;
    atmosphere: string;
    duration_feel: string;
    full_prompt: string;
  };
  asmr: string;
}

export interface PromptOutput {
  scenes: ScenePrompt[];
}

const SYSTEM_INSTRUCTION = `You are a professional Master Cinematic Prompt Engineer specializing in high-end AI film production. 
Your job is to generate extremely detailed, production-ready cinematic prompts per scene.

CRITICAL RULES:
- SUBJECT IDENTIFICATION: 
  - For IMAGE-TO-IMAGE prompts: If the count of subjects is 1, use "the character in the reference image". If the count is greater than 1, use "the character in the reference image 1", "the character in the reference image 2", etc.
  - For IMAGE-TO-VIDEO prompts: If the count of subjects is 1, use "The character". If the count is greater than 1, use "character 1", "character 2", etc.
- SUBJECT: NEVER mention real names/celebrities. Use the specific identifiers above. STRICT RULE: DO NOT describe or mention any type of clothing or outfit for these characters in the Image-to-Image (I2I) prompts unless "Plus Outfit" is disabled. Focus exclusively on physical textures (skin, eyes, hands), micro-expressions, and posture. Characters from reference images MUST remain clothing-neutral in description within I2I prompts by default.
- NO REDUNDANCY: You MUST NOT repeat the subject identifier twice in a row. Use it once as the main anchor for the description.
- I2V SUBJECT RULES: In Image-to-Video prompts ("full_prompt"), you MUST NOT use the phrase "with all outfit". Always use the simplified "The character" or "character [number]" identifiers.
- NO LOCATION NAMES: In Image-to-Video prompts ("full_prompt"), you are STRICTLY FORBIDDEN from mentioning specific names of locations, cities, countries, or landmarks (e.g., "Paris", "Eiffel Tower", "Tokyo"). Instead, describe the environment using generic but highly detailed visual descriptors (e.g., "a neon-drenched futuristic metropolis", "a lush tropical jungle with ancient ruins").
- NEW CHARACTERS: If the User Input / Story Description mentions additional people not covered by the reference characters, you MUST describe these "new characters" with high specificity. By default, additional characters should be of Indonesian ethnicity unless specified otherwise.
- CHARACTER CONSISTENCY (IMPORTANT): If a character appears in multiple scenes, you MUST re-describe them in FULL EXACT DETAIL every time. Do NOT use abbreviations or shorter versions in later scenes.
- CHARACTER DESCRIPTION FORMAT: Follow this strict structure for any character description: "[Name], [Ethnicity] [Gender] [Age] years old, [Hair description], [Skin/Texture details], [Body shape], [Eye/Face shape details], [Nose/Mouth details], Wearing [Highly specific clothing/outfit details including layering], Natural Lighting".
- LIGHTING & ATMOSPHERE: You MUST use ONLY natural, realistic lighting. You are STRICTLY FORBIDDEN from using stylized or artificial lighting terms such as "Volumetric God Rays", "Rim Lighting", "Cyberpunk Neon", "Golden Hour", "Film Noir", "Chiaroscuro", "Neon Haze", "Sodium Vapor", "Anamorphic Flares", or "Ultraviolet". Focus exclusively on describing natural light states like "soft overcast daylight", "natural window light", "gentle afternoon sun", "cool moonlight", or "ambient interior glow without artificial sources". NEVER include the word "Softbox" or any studio equipment.
- CAMERA DISTANCE: NEVER use Close-Up (CU), Extreme Close-Up (ECU), or Macro Shot. Always maintain a cinematic distance (Medium Shot or wider).
- DETAIL LEVEL: Prompts must be dense with technical terminology. Avoid generic words like "cinematic" or "beautiful". Use specific descriptors.
- FORCED SUFFIX: Every "full_prompt" in the "image_to_video" section MUST end with exactly: "No Music, No Backsound, No Slowmotion". Do NOT add this suffix to any "image_to_image" prompts.
- JSON FORMAT: Always respond in valid JSON only.

PROMPT ARCHITECTURE:
1. Image-to-Image (I2I): You must follow the Imagen 3 (Nano Banana) Prompting Framework. Prompts should be written in natural, descriptive language—be verbose and specific.
   - ARCHITECTURE: [Shot Context/Composition] + [Character Descriptions (Primary & Secondary)] + [Highly Detailed Actions & Poses] + [Environment/Setting] + [Natural Lighting & Atmosphere] + [Artistic Style/Medium].
   - FLEXIBLE ORDERING: The sequence of description MUST follow the visual hierarchy of the shot. If a secondary character or environmental element is in the foreground, describe it first before the primary "character in the reference image".
   - SUBJECT: Use the identifiers ("the character in the reference image", etc.) as the core label. Do NOT repeat or stutter these labels (e.g., avoid "the character... The character...").
   - NO CLOTHING FOR REFERENCE SUBJECTS: STRICT RULE: DO NOT describe or mention any type of clothing or outfit for these characters in I2I prompts unless "Plus Outfit" is disabled. Focus only on physical textures, expressions, and posture.
   - NEW CHARACTERS: Provide specific visual details (features, physique, and clothing) for characters NOT in the reference images.
   - POSE & BODY LANGUAGE: Describe poses with extreme anatomical detail. If multiple characters are present, give each one a distinct, dynamic, and non-repetitive pose based on their role in the scene.
   - CAMERA ANGLES: Use dynamic, contextually appropriate camera views (e.g., "a low-angle dramatic shot", "a sweeping wide-angle perspective").
   - CONTINUITY: Generate TWO separate prompts with extreme visual continuity. The only change should be a subtle micro-transition.
   - DETAIL DENSITY: Prompts must be dense with specific descriptors. Use technical terms for lighting and camera rather than generic words.
2. Image-to-Video (I2V): You must follow the Kling AI Prompt Architecture for realistic, high-fidelity motion. 
   - ARCHITECTURE: [Subject Identification] + [Dynamic Physical Action] + [Detailed Environment] + [Camera Move & Perspective] + [Cinematic Style & Quality].
   - CHARACTER MOTION: Characters MUST perform clear, realistic, and purposeful physical actions based on the story description (e.g., "running through a crowded street", "slowly reaching for a glowing artifact", "turning her head with a look of realization"). Avoid static characters; they must exhibit weight, fluid physics, and natural bodily movement.
   - Must end with "No Music, No Backsound, No Slowmotion".
3. ASMR: This field should contain a standalone version of the hyper-detailed soundscape (foley) for the scene. Focus on textures, mechanical clicks, biological sounds, or environmental ambiance. DO NOT include these details in the I2V prompt.

DATABASE: CAMERA VIEWS
Extreme Wide Shot (EWS) | Wide Shot (WS) | Full Shot (FS) | Medium Long Shot (MLS) | Medium Shot (MS) | Medium Close-Up (MCU) | Eye Level | Low Angle | High Angle | Worm's Eye View | Bird's Eye View | God's Eye View | Dutch Angle | POV | Over-the-Shoulder (OTS) | Two-Shot | Fisheye View | Isometric View | Telephoto/Compression | Drone View | CCTV | Action Cam

DATABASE: CAMERA MOVEMENTS
Slow/Fast Dolly In/Out | Zolly Effect | Reveal from Behind/Blur | Rack Focus | Tilt UP/Down | Truck L/R | Orbit (180/360) | Cinematic Arc | Crane Up/Down | Snap Zoom | FPV Drone Dive | Handheld Documentary | Whip Pan | Hyperlapse | Barrel Roll | Bullet Time | Parallax Tracking

DATABASE: LIGHTING & ATMOSPHERE
Natural Daylight | Overcast Soft Light | Direct Sunlight | Dappled Sunlight | Ambient Afternoon Glow | Hazy Morning Light | Cool Moonlight | Warm Interior Lamp Light | Natural Shadow Contrast | Neutral White Balance | Clear Sky Illumination | Diffused Cloud Cover | Soft Twilight | Morning Mist | Gentle Window Light Focus

OUTPUT FORMAT:
{
  "scenes": [
    {
      "scene": "Project Title - Scene 01",
      "image_to_image": {
        "subject": "Exceedingly detailed description",
        "camera_view": "Specific view",
        "lighting": "Rig description",
        "lens": "Lens specs",
        "style_tags": "keywords",
        "first_frame_prompt": "master prompt describing the start...",
        "last_frame_prompt": "master prompt describing the end..."
      },
      "image_to_video": {
        "subject": "Focus on high-fidelity motion",
        "camera_view": "Specific view",
        "camera_movement": "Kinetic vector",
        "lighting": "Dynamic lighting shifts",
        "atmosphere": "Particle and fluid physics",
        "duration_feel": "Cadence",
        "full_prompt": "The character [performs a dynamic action] in the [environment], [camera movement] shot, [lighting style]. No Music, No Backsound, No Slowmotion"
      },
      "asmr": "Hyper-detailed foley/soundscape description"
    }
  ]
}`;

export async function generateCinematicPrompts(
  description: string, 
  projectTitle: string, 
  numScenes: number, 
  engineTopic: string,
  numSubjects: number,
  enableLastFrame: boolean,
  plusOutfit: boolean,
  modelId: string = "gemini-3.1-pro-preview",
  customConfig?: { baseUrl: string; modelName: string; apiKey: string }
): Promise<PromptOutput> {
  const model = modelId;

  const outfitInstruction = plusOutfit
    ? `- I2I SUBJECT IDENTIFICATION (Plus Outfit): For Image-to-Image ONLY, if count is 1, use exactly "the character in the reference image with all outfit". If count > 1, use "the character in the reference image [number] with all outfit".
- NO REPETITION: Ensure this phrase is used naturally in the flow of the description without being repeated twice consecutively.
- OUTFIT CONSISTENCY: Since "Plus Outfit" is active, DO NOT describe or mention any specific clothing items, colors, or fabrics for these characters in I2I prompts.`
    : `- I2I OUTFIT CREATIVITY: Since "Plus Outfit" is disabled, you are FREE to describe any type of clothing or outfit for the characters in I2I prompts that fits the story context, atmosphere, or specific user requests. 
- OUTFIT CONSISTENCY: You MUST ensure that the described outfit remains IDENTICAL and consistent across ALL generated scenes.`;

  const lastFrameInstruction = enableLastFrame 
    ? `- "last_frame_prompt": MUST be a direct, subtle continuation of the first frame. 
   - CONTINUITY RULES: Position, camera angle, lighting architecture, and primary environmental elements MUST remain identical between both prompts. 
   - SUBTLE TRANSITIONS: The difference between "first_frame" and "last_frame" must be subtle/micro-movements: a slight shift in facial expression, wind catching the hair, dust motes drifting, eyes blinking, or a very minor hand displacement. DO NOT change the background, core composition, or camera view.`
    : `- "last_frame_prompt": Leave this field as an EMPTY STRING (""). DO NOT generate any content for it.`;

  const normalTopicInstruction = engineTopic === "Normal"
    ? `- CONSISTENT LIGHTING/ATMOSPHERE: Since the topic is "Normal", you MUST maintain identical lighting architecture and atmospheric conditions across ALL generated scenes to ensure absolute visual uniformity.`
    : "";

  const storyFlowInstruction = engineTopic === "Alur Cerita"
    ? `- ALUR CERITA MODE: You MUST introduce additional characters as part of the story flow.
- DEFAULT ETHNICITY: Any additional character introduced MUST be of Indonesian ethnicity (e.g., "Indonesian man", "Indonesian woman") with typical local physical features, unless the story description explicitly requests a different nationality/ethnicity.
- CHARACTER CONSISTENCY: If an additional character appears in more than one scene, their description MUST be copied EXACTLY and completely (word-for-word) in each scene they appear in to ensure perfect visual consistency across the film sequence. Never summarize or omit details for recurring characters.`
    : "";

  const iklanInstruction = engineTopic === "Iklan"
    ? `- IKLAN (ADVERTISING) MODE:
    1. PRODUCT HIGHLIGHT: You MUST prioritize highlighting the product mentioned in the user's description. The product must be the focal point of every scene.
    2. BACKGROUND VARIATION: If the user provides a background/setting, you MUST vary the specific viewpoint for each scene. Scene 1 establishes the primary location; subsequent scenes MUST take place in different spots or at different angles within that same general area to create visual variety while maintaining spatial continuity.
    3. CAMERA RESTRICTIONS (I2V): You are STRICTLY FORBIDDEN from using "Dolly Out", "Zoom Out", or "Crane Shot" movements in the image_to_video prompts. Use only Dolly In, Pan, Tilt, or Static shots that emphasize the product's details.
    4. POSE RESTRICTIONS: You are STRICTLY FORBIDDEN from describing any character "running". Characters should have sophisticated, elegant, or purposeful poses that align with a high-end commercial aesthetic.
    5. FOCUS: Every prompt must be meticulously crafted to draw attention to the product's texture, design, and premium quality.`
    : "";

  const dynamicSystemInstruction = `${SYSTEM_INSTRUCTION}

SPECIFIC SCENE GENERATION RULES:
${outfitInstruction}
${lastFrameInstruction}
${normalTopicInstruction}
${storyFlowInstruction}
${iklanInstruction}
`;

  const userText = `Topic/Genre: ${engineTopic}\nProject Title: ${projectTitle}\nStory Description: ${description}\nNumber of Subjects: ${numSubjects}\nGenerate ${numScenes} distinct scenes.`;

  if (modelId === 'custom' && customConfig) {
    let baseUrl = customConfig.baseUrl.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Most providers need /v1 if it's missing, but we'll try to be smart
    const url = baseUrl.includes('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customConfig.apiKey}`
        },
        body: JSON.stringify({
          model: customConfig.modelName,
          messages: [
            { role: "system", content: dynamicSystemInstruction },
            { role: "user", content: userText }
          ],
          // Some custom providers don't support response_format: 'json_object'
          // We'll omit it for now to be more compatible, or add it via a toggle if needed
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = response.statusText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`Custom AI Error (${response.status}): ${errorMessage}`);
      }

      const json = await response.json();
      let content = json.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Custom AI returned an empty response or invalid format.");
      }

      // Robust parsing: Clean markdown blocks if present
      content = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      
      try {
        return JSON.parse(content) as PromptOutput;
      } catch (e) {
        console.error("JSON Parse Error on content:", content);
        throw new Error("Failed to parse the response as valid JSON. The model might not have followed the requested format.");
      }
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("An unexpected error occurred during the custom AI request.");
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ 
      parts: [{ 
        text: userText
      }] 
    }],
    config: {
      systemInstruction: dynamicSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene: { type: Type.STRING },
                image_to_image: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    camera_view: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                    lens: { type: Type.STRING },
                    style_tags: { type: Type.STRING },
                    first_frame_prompt: { type: Type.STRING },
                    last_frame_prompt: { type: Type.STRING },
                  },
                  required: ["subject", "camera_view", "lighting", "lens", "style_tags", "first_frame_prompt", "last_frame_prompt"]
                },
                image_to_video: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    camera_view: { type: Type.STRING },
                    camera_movement: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                    atmosphere: { type: Type.STRING },
                    duration_feel: { type: Type.STRING },
                    full_prompt: { type: Type.STRING },
                  },
                  required: ["subject", "camera_view", "camera_movement", "lighting", "atmosphere", "duration_feel", "full_prompt"]
                },
                asmr: { type: Type.STRING }
              },
              required: ["scene", "image_to_image", "image_to_video", "asmr"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as PromptOutput;
}
