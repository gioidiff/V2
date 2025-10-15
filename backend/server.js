
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const characterSchema = {
  type: Type.OBJECT,
  properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
  required: ["name", "description"],
};
const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    scene_id: { type: Type.INTEGER },
    setting: { type: Type.STRING },
    time: { type: Type.STRING },
    location: { type: Type.STRING },
    characters: { type: Type.ARRAY, items: characterSchema },
    dialogue: { type: Type.STRING },
    scene_length_seconds: { type: Type.INTEGER },
  },
  required: [ "scene_id", "setting", "time", "location", "characters", "dialogue", "scene_length_seconds" ],
};
const responseSchema = { type: Type.ARRAY, items: sceneSchema };

const callGemini = async (prompt) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Empty response from API");
    return JSON.parse(text.replace(/^```json\s*|```$/g, ''));
};

app.post('/api/generate', async (req, res) => {
  try {
    const { transcript, characterDescription } = req.body;
    if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required.' });
    }
    const prompt = `
    Bạn là một trợ lý AI chuyên tạo kịch bản video dưới dạng JSON. Nhiệm vụ của bạn là nhận một đoạn văn bản (transcript) và một mô tả nhân vật (tùy chọn), sau đó chuyển đổi chúng thành một cấu trúc JSON gồm nhiều cảnh (scenes).
    **Yêu cầu về định dạng JSON đầu ra:**
    - Đầu ra phải là một mảng JSON (một danh sách các cảnh).
    - Mỗi cảnh là một đối tượng JSON chứa các khóa sau: "scene_id", "setting", "time", "location", "characters", "dialogue", và "scene_length_seconds".
    - Khóa "characters" phải là một mảng, chứa các đối tượng nhân vật xuất hiện trong cảnh.
    - Mỗi đối tượng nhân vật phải có "name" và "description".
    - "scene_length_seconds" là một số nguyên ước tính thời lượng của cảnh.
    **Quy tắc xử lý:**
    1.  Đọc kỹ "transcript" để chia thành các cảnh logic dựa trên sự thay đổi về bối cảnh, thời gian hoặc sự kiện.
    2.  Nếu có "Mô tả nhân vật" được cung cấp, hãy sử dụng chính xác mô tả đó cho nhân vật chính trong tất cả các cảnh mà nhân vật đó xuất hiện để đảm bảo tính đồng nhất.
    3.  Nếu không có mô tả, hãy tự suy luận một mô tả ngắn gọn dựa trên nội dung transcript.
    4.  Tách lời thoại và gán cho đúng nhân vật trong phần "dialogue".
    5.  Bắt đầu scene_id từ 1.
    **Dưới đây là dữ liệu đầu vào:**
    **Transcript:**
    ${transcript}
    **Mô tả nhân vật chính:**
    ${characterDescription || 'Không có'}
    Bây giờ, hãy tạo ra mảng JSON theo yêu cầu.`;
    
    const result = await callGemini(prompt);
    res.json(result);

  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content from AI.' });
  }
});

app.post('/api/expand', async (req, res) => {
    try {
        const { existingScenes, scenesToAdd } = req.body;
        if (!existingScenes || scenesToAdd == null) {
            return res.status(400).json({ error: 'existingScenes and scenesToAdd are required.'});
        }
        const lastSceneId = existingScenes.length > 0 ? existingScenes[existingScenes.length - 1].scene_id : 0;
        const prompt = `
        Bạn là một trợ lý AI chuyên viết tiếp kịch bản video. Dưới đây là các cảnh đã có. Dựa trên bối cảnh này, hãy viết tiếp ${scenesToAdd} cảnh nữa.
        **Yêu cầu về định dạng JSON đầu ra:**
        - Định dạng phải giống hệt các cảnh đã có.
        - "scene_id" phải bắt đầu từ ${lastSceneId + 1} và tăng dần.
        **Các cảnh đã có:**
        ${JSON.stringify(existingScenes, null, 2)}
        Bây giờ, hãy tạo ra ${scenesToAdd} cảnh JSON tiếp theo. Chỉ trả về các cảnh mới.`;

        const result = await callGemini(prompt);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/expand:', error);
        res.status(500).json({ error: error.message || 'Failed to expand script.' });
    }
});

app.listen(port, () => {
  console.log(`PromptVEO3 V2 backend listening on port ${port}`);
});
