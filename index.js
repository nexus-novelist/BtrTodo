const listContainer = document.getElementById("list-container");
const inputBox = document.getElementById("input-box");

let todos = JSON.parse(localStorage.getItem("todo-list"));

let isEditing = false,
curEditTask = undefined;

function generateUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function loadTodo(){
    if(todos){
        todos.forEach((todo, i) => {
            addTodo(todo.text, todo.id);
        });
    }
}

loadTodo();

function addTodo(text, id){
    if(text == ""){
        alert("You must write something!");
    }else{
        let todo = document.createElement("li");
        todo.id = id;
        let todoText = document.createElement("p");
        todoText.textContent = text;
        todo.appendChild(todoText);
        let deleteBtn = document.createElement("span");
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can delete-btn"></i>`;
        todo.appendChild(deleteBtn);
        let editBtn = document.createElement("span");
        editBtn.innerHTML = `<i class="fa-solid fa-pen edit-btn"></i>`;
        todo.appendChild(editBtn);
        const task = getTaskById(id);
        if(todos.find((value) => value == task).checked){
            todo.classList.add("checked");
        }
        listContainer.appendChild(todo);
    }
}

function checkTodo(id){
    const taskEl = document.getElementById(id);
    const task = getTaskById(id);
    todos.find((value) => value == task).checked = !todos.find((value) => value == task).checked;
    localStorage.setItem("todo-list", JSON.stringify(todos));
    taskEl.classList.toggle("checked");
}

function createTodo(){
    if(!isEditing){
        const uuid = generateUUID();
        todos = !todos ? [] : todos;
        let taskInfo = {text: inputBox.value, id: uuid, checked: false};
        todos.push(taskInfo);
        localStorage.setItem("todo-list", JSON.stringify(todos));
        addTodo(inputBox.value, uuid);
        inputBox.value = "";
    }else{
        editTask();
    }
}

function deleteTask(id) {
    const task = getTaskById(id);
    const i = todos.indexOf(task);
    todos.splice(i, 1);
    localStorage.setItem("todo-list", JSON.stringify(todos));
    document.getElementById(id).remove();
}

function editTask(id) {
    if(!isEditing){
        const task = getTaskById(id);
        curEditTask = task;
        isEditing = true;
        inputBox.value = task.text;
    }else{
        const i = todos.indexOf(curEditTask);
        todos[i].text = inputBox.value;
        localStorage.setItem("todo-list", JSON.stringify(todos));
        inputBox.value = "";
        document.getElementById(curEditTask.id).childNodes[0].textContent = todos[i].text;
        isEditing = false;
        curEditTask = undefined;
    }
}

function clearAll() {
    todos = [];
    localStorage.setItem("todo-list", JSON.stringify(todos));
    listContainer.innerHTML = "";
}

function getTaskById(id) {
    let found = undefined;
    todos.forEach((task, i) => {
        if(task.id == id){
            found = task;
        }
    });
    return found;
}

listContainer.addEventListener("click", (e) => { //check todo
    if(e.target.tagName == "LI"){
        const id = e.target.id;
        checkTodo(id);
    }else if(e.target.classList.contains("delete-btn")) {
        const id = e.target.parentElement.parentElement.id;
        deleteTask(id);
    }else if(e.target.classList.contains("edit-btn")) {
        const id = e.target.parentElement.parentElement.id;
        editTask(id);
    }
})

inputBox.onkeyup = ((e) => { //create todo by pressing enter
    if(e.key == "Enter") {
        if(!isEditing){
            createTodo();
        }else{
            editTask();
        }
    }
});