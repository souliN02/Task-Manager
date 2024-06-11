$(document).ready(function() {
    // Fetch and display the current user's name
    $.get('/current-user', function(data) {
        $('#user-name').text(data.name);
    });

    // Fetch and display the tasks
    $.get('/tasks-data', (tasks) => {
        tasks.forEach((task) => {
            $('#task-list').append(`
                <li>
                    ${task.description}
                    <button onclick="updateTask(${task.id})">Update</button>
                    <button onclick="deleteTask(${task.id})">Delete</button>
                </li>
            `);
        });
    });

    // Handle form submission
    $('#create-task-form').submit(function(event) {
        event.preventDefault();

        var taskField = $('[name=task]');
        var descriptionField = $('[name=description]');

        $.post('/tasks', {
            task: taskField.val(),
            description: descriptionField.val(),
        }, function(data) {
            $('#task-list').append(`
                <li>
                    ${data.description}
                    <button onclick="updateTask(${data.id})">Edit</button>
                    <button onclick="deleteTask(${data.id})">Delete</button>
                </li>
            `);
        });
    });
});

// Update task function
function updateTask(id) {
    const newDescription = prompt('Enter new task description');
    if (newDescription) {
        $.ajax({
            url: '/tasks/' + id,
            type: 'PUT',
            data: { description: newDescription },
            success: function(result) {
                location.reload();
            }
        });
    }
}

// Delete task function
function deleteTask(id) {
    $.ajax({
        url: '/tasks/' + id,
        type: 'DELETE',
        success: function(result) {
            location.reload();
        }
    });
}