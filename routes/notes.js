import express from 'express';
import { addNote } from '../persistence.js';
import { removeNote } from '../persistence.js';
import { updateNote } from '../persistence.js';

const router = express.Router();

router.post('/', (req, res) => {
    console.log(req.body);
    const { noteText } = req.body; 
    if (!noteText) {
        res.status(400).send({ error: 'Note text is required' });
        return;
    }
    const note = { text: noteText };
    addNote(note);
    res.status(201).send(note);
});

router.delete('/:id', (req, res) => {
    const noteId = req.params.id;
    const result = removeNote(noteId);
    res.status(200).send({ message: 'Note deleted successfully' });
});

router.put('/:id', (req, res) => {
    const noteId = req.params.id;
    const { text } = req.body;
    console.log('Updating note with ID:', noteId);
    const updatedNote = updateNote(noteId, text);
    res.status(200).send(updatedNote);
});

export default router;