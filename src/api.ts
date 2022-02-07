import axios from 'axios';
import { writeFileSync } from 'fs';

async function newPaste(dataUrl: string, language: string): Promise<string | null> {
    const req = await axios.get(dataUrl);
    const data = req.data;
    const newPasteReq = await axios.post(
        'https://dustbin.me/api/new',
        {
            data: data,
            language: language,
        }
    );
    if (!newPasteReq.data.error) {
        return newPasteReq.data.id;
    }
    return null;
}

async function getPaste(pasteId: string): Promise<Object | null> {
    const req = await axios.post(
        'https://dustbin.me/api/get',
        {
            fileId: pasteId,
        }
    );
    if (!req.data.error) {
        writeFileSync(`./${req.data.id}`, req.data.data);
        return {
            id: req.data.id,
            language: req.data.language,
        };
    }
    return null;
}

export default {
    newPaste,
    getPaste,
};