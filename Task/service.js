let taskNumberError = document.getElementById("taskNumberError");
let timeEstimateError = document.getElementById("timeEstimateError");
let actualHoursError = document.getElementById("actualHoursError");
let searchError = document.getElementById("searchError");
const taskNumberRegex = /^[A-Za-z]\d{5}$/;
const timerRegex = /^\d+(\.[0-5][0-9]?)?$/;
let taskNumber;
let estTime;
let estEditor;
let actHours;
let finalEditor;

// function to show tab content
function show(evt, id){
    const tabcontent = document.getElementsByClassName("tabcontent");
    for(let element of tabcontent){
        // if element has id = id, then add active class if not remove active class
        if(element.id === id)
            element.classList.add("active");
        else
            element.classList.remove("active");
    }
}

// function to add Rich Text Editor
async function addCKEditor(id){
    return await ClassicEditor
        .create(document.getElementById(id));
}
addCKEditor("editor")
    .then(editor=>estEditor = editor)
    .catch(error => console.error(error));

// watch task number value and display error if not valid
document.getElementById("taskNumber")
    .addEventListener("keyup", (e) => {
        if(e.target.value === "")
            taskNumberError.innerHTML = "";
        else if(!taskNumberRegex.test(e.target.value))
            taskNumberError.innerHTML = "Task no should be in format: L##### where L is a letter and # is a number.";
        else
            taskNumberError.innerHTML = "";
        taskNumber = e.target.value;
});

// watch actual hours value and display error if not valid
document.getElementById("timeEstimate")
    .addEventListener("keyup", (e) => {
        if(e.target.value === "") 
            timeEstimateError.innerHTML = "";
        else if(!timerRegex.test(e.target.value))
            timeEstimateError.innerHTML = "Estimate Time should be a number with decimal i.e 1.20, 1.59. Decimal part cannot be more than .59";
        else
            timeEstimateError.innerHTML = "";
        estTime = e.target.value;
});

document.getElementById("actualHours")
    .addEventListener("keyup", (e) => {
        if(e.target.value === "")
            actualHoursError.innerHTML = "";
        else if(!timerRegex.test(e.target.value))
            actualHoursError.innerHTML = "Actual Hours should be a number with decimal i.e 1.20, 1.59. Decimal part cannot be more than .59";
        else
            actualHoursError.innerHTML = "";
        actHours = e.target.value;
});

// clear all fields
function clearFields(){
    document.getElementById("taskNumber").value = "";
    document.getElementById("timeEstimate").value = "";
    document.getElementById("actualHours").value = "";
    estEditor.setData("");
    if(finalEditor !== undefined)
        finalEditor.setData("");
}

// validate task number
function validateTaskNumber(taskNumber){
    if(taskNumber === "" || taskNumber === undefined){
        alert("Please enter task number");
        return false;
    }
    if(!taskNumberRegex.test(taskNumber)){
        alert("Task no should be in format: L##### where L is a letter and # is a number.");
        return false;
    }
    return true;
}

// validate time estimate
function validateTime(estTime, placeholder){
    if(estTime === "" || estTime === undefined){
        alert(`Please enter ${placeholder.toLowerCase()} time`);
        return false;
    }
    if(!timerRegex.test(estTime)){
        alert(`${placeholder} Time should be a number with decimal i.e 1.20, 1.59. Decimal part cannot be more than .59`);
        return false;
    }
    return true;
}

// save task as draft
function saveTask(){
    if(!validateTaskNumber(taskNumber))
        return;
    if(!validateTime(estTime, "Estimated"))
        return;
    if(estEditor.getData() === ""){
        alert("Please enter Estimated Note");
        return;
    }
    // confirm if user wants to save task as draft
    if(!confirm("Do you want to save task as draft?"))
        return;

    axios.post("http://localhost:8080/newdraft", 
    JSON.stringify({taskNumber, estTime, estNote: estEditor.getData()}),
    {
        headers: {
        'Content-Type': 'application/json',
        },
    }).then(response => {
        alert(response.data)
        clearFields();})
    .catch(error => {
        alert(error.response.data);
    });
}

// save task permanently
function completeTask(){
    if(!validateTaskNumber(taskNumber))
        return;
    if(!validateTime(estTime, "Estimated"))
        return;
    if(estEditor.getData() === ""){
        alert("Please enter Estimated Note");
        return;
    }
    if(!validateTime(actHours, "Actual"))
        return;
    if(finalEditor.getData() === ""){
        alert("Please enter Final Note");
        return;
    }   
    // confirm if user wants to save task permanently
    if(!confirm("Do you want to save task permanently?"))
        return;

    axios.post("http://localhost:8080/final",
    JSON.stringify({taskNumber, estTime, estNote: estEditor.getData(), actHours, finalNote: finalEditor.getData()}),
    {
        headers: {
        'Content-Type': 'application/json',
        },
    }).then(response => {
        alert(response.data)
        clearFields();
        document.getElementById("modal").close();
    }).catch(error => alert(error.response.data));
}

// sace task as draft
document.getElementById("save-task")
    .addEventListener("click", () => {
        saveTask();
});

// save task permanently
document.getElementById("final-save")
    .addEventListener("click", () => {
        completeTask();
});

// open the modal
document.getElementById("complete-task")
    .addEventListener("click", () => {
        document.getElementById("modal").showModal();
        if(finalEditor !== undefined)
            return;
        addCKEditor("editor1")
            .then(editor=>finalEditor = editor)
            .catch(error => console.error(error));
});

// close the modal
document.getElementById("close")
    .addEventListener("click", () => {
        document.getElementById("modal").close();
});

/* Update Section */
let typingTimer;
document.getElementById("search")
    .addEventListener("keyup", (e) => {
        const searchElement = document.querySelector("#update>div:last-child").innerHTML = "";
        if(e.target.value === ""){
            searchError.innerHTML = "";
            searchElement.innerHTML = "";
            return;
        }else if(!taskNumberRegex.test(e.target.value)){
            searchError.innerHTML = "Task no should be in format: L##### where L is a letter and # is a number.";
            searchElement.innerHTML = "";
            return;
        }else
            searchError.innerHTML = "";

        if(e.target.value.length != 6){
            document.querySelector("#update>div:last-child").innerHTML = "";
            return;
        }
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            getTaskByNumber(e.target.value)
                .then(dbTask => {
                    if(dbTask.length==0)
                        document.querySelector("#update>div:last-child").innerHTML = `<h2 style="color: red; 
                    text-align: center; width:100%;">No Task Found with Task Number: ${e.target.value}</h2>`;
                    else
                        addElementsToDOM(formatDbResult(dbTask));
                }).catch(err=>console.log(err));
        }, 1000);
});

function formatDbResult(dbTask){
    const formattedDBTask = {};
    for(const row of dbTask){
        // add task_number property to formattedDBTask if not present if present do nothing
        if(!formattedDBTask.hasOwnProperty("task_number"))
            formattedDBTask.task_number = row.task_number;
        // add actual_hours property to formattedDBTask if not present if present do nothing
        if(!formattedDBTask.hasOwnProperty("actual_hours"))
            formattedDBTask.actual_hours = row.actual_hours;
        // add notes property to formattedDBTask if not present if present do nothing
        if(!formattedDBTask.hasOwnProperty("notes"))
            formattedDBTask.notes = row.notes;
        // add completed property to formattedDBTask if not present if present do nothing
        if(!formattedDBTask.hasOwnProperty("completed"))
            formattedDBTask.completed = row.completed;
        // add time_estimate property to formattedDBTask if not present if present add 1 more item to time_estimate
        if(!formattedDBTask.hasOwnProperty("time_estimate"))
            formattedDBTask.time_estimate = [row.time_estimate];
        else
            formattedDBTask.time_estimate.push(row.time_estimate);
        // add estimate_note property to formattedDBTask if not present if present add 1 more item to estimate_note
        if(!formattedDBTask.hasOwnProperty("estimate_note"))
            formattedDBTask.estimate_note = [row.estimate_notes];
        else
            formattedDBTask.estimate_note.push(row.estimate_notes);
    }
    return formattedDBTask;
}

// get task by task number from database
async function getTaskByNumber(taskNumber){
    try{
        const response = await axios.get(`http://localhost:8080/task/${taskNumber}`);
        return response.data;
    }catch(err){
        console.log(err.message);
        alert(err.message);
    }
}
function addHelper(dbTask){
    const len = dbTask.completed===1 ? dbTask.time_estimate.length+1 : dbTask.time_estimate.length;
    for(let i=0; i<len; i++){
        const name = i===dbTask.time_estimate.length ? "finNote" : `estNote${i}`;
        const data = i===dbTask.time_estimate.length ? dbTask.notes : dbTask.estimate_note[i];
        ClassicEditor
            .create(document.getElementById(name), {
                toolbar: {
                    items: []
                }
            }).then(editor => {
                editor.setData(data);
                document.querySelector(`#${name}+div .ck-editor__editable[role="textbox"]`)
                    .setAttribute("contenteditable", "false");
            }).catch(error => {
                console.error(error);
            });
    }
}

// add dbTask da to elements on DOM
function addElementsToDOM(dbTask){
    console.log(dbTask);
    const element = document.querySelector("#update>div:last-child");
    element.innerHTML = "";
    element.innerHTML += addTaskNumberDOM(dbTask.task_number);
    taskNumber = dbTask.task_number;
    if(dbTask.completed===1){
        element.innerHTML += `${addEstimateTimesAndNotesDOM(dbTask.time_estimate, dbTask.estimate_note)}`;
        element.innerHTML += addTimesAndNotesDOMHelper(dbTask.actual_hours, 0, 1, true);
        addHelper(dbTask);
    }
    else{
        element.innerHTML += `<div class="rte estTimeNote"><div>
            ${addEstimateTimesAndNotesDOM(dbTask.time_estimate, dbTask.estimate_note)}
        </div></div>`;
        element.innerHTML += `<div class="icon add">
            <img src="./public/asset/addFill.png" alt="add" id="add_icon" onclick="addEstimateTimeAndNote(event)">
        </div>
        <button onclick="permanentlySaveTask(event)">Complete Task</button>
        `;
        addHelper(dbTask);
    }
}
let updteEstTime;
let updateEstNoteEditor;
let updateFinTime;
let updateFinNoteEditor;
async function addEstimateTimeAndNote(e){
    const ele = document.querySelector("#add_new_est");
    if( ele !== null){
        ele.style.display = "grid";
        e.srcElement.style.display = "none";
        return;
    }
    const estTimeNote = document.querySelector(".estTimeNote");
    const newEstTimeNote = document.createElement("div");
    newEstTimeNote.id = "add_new_est";
    newEstTimeNote.innerHTML = `<div>
    ${addTimesAndNotesDOMHelper("", 'Update', 0, false)}</div>
    <div class="icon remove">
        <img src="./public/asset/remove.png" alt="remove" id="remove" onclick="removeEstimateTimeAndNote(event)">
    </div>
    <div>
        <button onclick="updateDraftTask(event)">Draft Task</button>
    </div>`;
    estTimeNote.appendChild(newEstTimeNote);

    e.srcElement.style.display = "none";
    try{
        updateEstNoteEditor = await ClassicEditor.create(document.getElementById("estNoteUpdate"));
    }catch(err){
        alert(err.message);
    }

    const updateInput = document.querySelector("#add_new_est input[type='text']");
    const updateInputError = document.createElement("span");
    updateInputError.id = "updateInputError";
    updateInputError.classList.add("error");
    updateInput.parentElement.appendChild(updateInputError);    
    updateInput.addEventListener("keyup", (e) => {
        console.log(e.target.value);
        if(e.target.value === "")
            updateInputError.innerHTML = "";
        else if(!timerRegex.test(e.target.value))
            updateInputError.innerHTML = "Estimate Time should be a number with decimal i.e 1.20, 1.59. Decimal part cannot be more than .59";
        else
            updateInputError.innerHTML = "";

        updteEstTime = e.target.value;        
    });
    console.log(updateEstNoteEditor);
}

let newEstTime;

function updateDraftTask(event){
    console.log(taskNumber, updteEstTime, updateEstNoteEditor.getData());
    if(!validateTime(updteEstTime, "Updated"))
        return;
    if(updateEstNoteEditor.getData() === ""){
        alert("Please enter Estimated Note");
        return;
    }
    // confirm if user wants to save task as draft
    if(!confirm("Do you want to save task as draft?"))
        return;

    axios.post("http://localhost:8080/draft", 
    JSON.stringify({taskNumber, updteEstTime, estNote: updateEstNoteEditor.getData()}),
    {
        headers: {
        'Content-Type': 'application/json',
        },
    }).then(response => {
        alert(response.data);
        // clear update section
        document.getElementById("search").value = "";
        document.querySelector("#update>div:last-child").innerHTML = "";
        document.getElementById("addTab").click();
    }).catch(error => {
        alert(error.response.data);
    });
}

function permanentlySaveTask(event){
    const ele = document.querySelector("#add_new_est");
    // if ele is null and display is none then mark task as completed
    if(ele === null || ele.style.display === "none"){
        console.log("Mark task as completed");
        showDialog();
        console.log(taskNumber);
    }else{
        console.log("Ask for Actual Time and Note");
        console.log(taskNumber, updteEstTime, updateEstNoteEditor.getData());
    }
}
function showDialog(){
    console.log("show dialog");
}

function removeEstimateTimeAndNote(e){
    e.srcElement.parentElement.parentElement.style.display = "none";
    document.querySelector("img#add_icon").style.display = "block";

}

function addTaskNumberDOM(value){
    return `<div>
            <label>Task Number:</label>
            <input type="text" value="${value}" disabled>
        </div>`;
}

function addEstimateTimesAndNotesDOM(estTimes, estNotes){
    if(estTimes.length === 1)
        return addTimesAndNotesDOMHelper(estTimes[0], 0, 0, true);
    else
        return estTimes.map((estTime, index) => {
            return addTimesAndNotesDOMHelper(estTime, index, 0, true);
        }).join("\n");
}

function addTimesAndNotesDOMHelper(time, index, type, setDisabled){
    const label = type === 0 ? "Estimate" : "Actual";
    const label1 = type === 0 ? `estNote${index}` : `finNote`;
    return `<div>
            <label>${label} Time:</label>
            <input type="text" value="${time}" ${setDisabled ? "disabled" : ""}>
        </div>  
        <div class="card-group rte">
            <label>${label} Note:</label>
            <div class="notes est-notes">
                <div id="${label1}"></div>
            </div>
        </div>`;
}