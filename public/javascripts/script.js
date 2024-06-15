document.addEventListener('DOMContentLoaded', (event) => {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const noteId = button.getAttribute('data-id');
            fetch(`/notes/${noteId}`, { method: 'DELETE' })
                .then((response) => {
                    if (response.ok) {
                        location.reload();
                    } else {
                        console.error('Delete failed');
                    }
                })
                .catch((error) => console.error('Error:', error));
        });
    });

    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const noteId = button.getAttribute('data-id');
            const noteDiv = document.querySelector(`.content-editable[data-id="${noteId}"]`);
            const updatedText = noteDiv.innerText;

            fetch(`/notes/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: updatedText })
            })
            .then((response) => {
                if (response.ok) {
                    location.reload();
                } else {
                    console.error('Edit failed');
                }
            })
            .catch((error) => console.error('Error:', error));
        });
    });
});