// ==UserScript==
// @name IU Table
// @description اضافة لتعديل مظهر الجدول بالجامعة الاسلامية الى جدول مرتب تبعا لايام الاسبوع بضغطة زر
// @include https://eduportal.iu.edu.sa/iu/ui/student/homeIndex.faces
// @include https://eduportal.iu.edu.sa/iu/ui/student/student_schedule/index/studentScheduleIndex.faces
// ==/UserScript==


// Rows are within these 2 class elements
row1 = document.querySelectorAll(".ROW1");
row2 = document.querySelectorAll(".ROW2");
// Where we append the info of every row
let rows = [];
const originalTableNode = document.getElementById('scheduleFrm:studScheduleTable');
const days = ['الاحد','الاثنين','الثلاثاء','الاربعاء','الخميس'];
let newTable = {};
let newTableNode;
let on = false;

// Recursive function that takes a node and returns the deepest text in that node
// By repetitively going into the first child of an element until an end road was found
function endText(node) {
    if (!node.firstElementChild) {
        return node.innerHTML;
    } else {
        return endText(node.firstElementChild);
    }
}

// Gathers the all the lectures and subjects info in an array called rows
function getTableInfo(nodes) {
    // For every row in 'nodes' elements
    for (let i = 0; i < nodes.length; i++) {
        // initialize an object for a row
        let row_obj = {};
        // Choose one element with class ROW1
        let row = nodes[i];
        let cells = row.children;
    
        // For every cell in the row
        for (let j = 0; j < cells.length; j++) {
            try {
                // If the cell is the messy one with 3 values at the same time
                if (cells[j].dataset.th.includes("القاعة")) {
                    // Get the names of the cells by splitting the string
                    let headers = cells[j].dataset.th.split(/\s+/);
                    // May look stupid but it's the best way to get the elements representing the lectures
                    let lectures = cells[j].firstElementChild.firstElementChild.children;
                    row_obj["محاضرات"] = [];
    
                    // For each lecture element
                    for (let k = 0; k < lectures.length; k++) {
                        let data = {};
                        // For every header representing values
                        for (let l = 0; l < headers.length; l++) {
                            let currentHeader = headers[l];
                            // add the header with its value in the lecture (depends on the data being consistent)
                            data[currentHeader] = endText(lectures[k].children[l]).trim();
                            // If the text has '&nbsp' which means it's the messy 'day' cell 
                            // then split it and get the part that has the number
                            if (data[currentHeader].includes("&nbsp")) {
                                data[currentHeader] = data[currentHeader].split('; ')[1].trim().split(' ');
                            }
                        }
                        // Apeend the object with lectures data to 'lectures' key in row_obj
                        row_obj["محاضرات"].push(data);
                    }
                } else {
                    // Else get the deepest text and give it to the name in the dataset th
                    let cellName = cells[j].dataset.th.trim();
                    row_obj[cellName] = endText(cells[j]).trim();
                    if (row_obj[cellName].includes("&nbsp")) {
                        row_obj[cellName] = row_obj[cellName].split('&')[0].trim();
                    }
                }
            } catch(err) {
                console.log(err)
            }
        }
        rows.push(row_obj);
    }    
}

// The part where everything about the original schedule is formatted and stored
try {
    // Make a button to activate the table or deactivate it
    let button = document.createElement('span');
    let cell = document.createElement('td');
    button.classList.add("BUTTON_LINK");
    button.style.cursor = "pointer";

    // Remember the last choice
    if (on) {
        button.style.backgroundColor = "firebrick";
        button.innerHTML = "الجدول&nbspالاصلي";
        originalTableNode.style.display = 'none';
        if (newTableNode) {
            newTableNode.style.display = null;
        } else {
            getTableInfo(row1);
            getTableInfo(row2);
            // console.log(rows);
            getNewTable();
            appendTable();
        }
    } else {
        // button.style.backgroundColor = "rgb(1, 130, 165)";
        button.innerHTML = "نظم&nbspالجدول";
        if (newTableNode){
            newTableNode.style.display = 'none';
        }
    }

    // Append the button to the DOM
    cell.appendChild(button);
    document.getElementById("scheduleFrm:printLink").parentElement.parentElement.appendChild(cell);

    button.onclick = function() {
        if (on) {
            on = false;
            button.style.backgroundColor = null;
            button.innerHTML = "نظم&nbspالجدول";
            originalTableNode.style.display = null;
            newTableNode.style.display = 'none';
        } else {
            on = true;
            button.style.backgroundColor = "firebrick";
            button.innerHTML = "الجدول&nbspالاصلي";
            // Hide the original table
            originalTableNode.style.display = 'none';
            if (newTableNode) {
                newTableNode.style.display = null;
            } else {
                if (rows.length == 0) {
                    getTableInfo(row1);
                    getTableInfo(row2);
                }
                getNewTable();
                appendTable();
            }
        }
    } 
} catch(err) {
    console.log(err);
}

function getNewTable()
{
    try {
        // Populate the new table with the days and their lectures
        for (i in days) {
            newTable[days[i]] = [];
        }
        for (i in rows) {
            let subjectLectures = rows[i]['محاضرات'];
            for (j in subjectLectures) {
                let lecture = subjectLectures[j];
                let time = lecture['الوقت'];

                function value(t) {
                    // Give a numerical value for the time of the day the lecture is at
                    let hour = parseInt(t.slice(0, 2), 10);
                    let minutes = parseInt(t.slice(3, 5), 10);
                    let total = (hour * 60) + minutes;

                    if (t.slice(0, 10).includes('م') && hour != 12) {
                        total += 720;
                    }

                    return total;
                }

                for (k in lecture["اليوم"]) {
                    let day = days[parseInt(lecture["اليوم"][k])-1];
                    newTable[day].push({subject: rows[i]['اسم المقرر'], activity: rows[i]['النشاط'], 
                    time: time, place: lecture['القاعة'], value: value(time)});
                }
            }
        }

        // Sort the lectures according to their time values
        for (i in newTable) {
            newTable[i].sort(function(a, b) {
                return a.value - b.value;
              });
        }
        // console.log(newTable);
    } catch(err) {
        console.log(err);
    }
}


// Append the new table info to the DOM
function appendTable() {
    // Creating the table with its attributes and children
    let table = document.createElement('table');
    table.classList.add('rowFlow');
    table.width = "100%";
    table.cellPadding = '0';
    table.cellPadding = '0';
    table.border = '1';
    originalTableNode.insertAdjacentElement('afterend', table);

    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody')
    table.appendChild(thead);
    table.appendChild(tbody);

    // Append days as table headers
    for(i in days) {
        let th = document.createElement('th');
        th.innerHTML = days[i];
        th.classList.add('HEADING');
        th.scope = "col";
        thead.appendChild(th);
    }

    function maxDayLength(obj) {
        // Returns the highest number of lictures in one day
        let max;
        for (i in obj) {
            if (obj[i].length > max) {
                max = obj[i].length;
            } else if (!max) {
                max = obj[i].length;
            } else {
                continue
            }
        }
        return max;
    }

    const maxLength = maxDayLength(newTable);

    // append empty cells as many as the number of lectures during the busiest day
    for (let i = 0; i < maxLength; i++) {
        let tr = document.createElement('tr');
        tbody.appendChild(tr);
        for (j in days) {
            let td = document.createElement('td');
            tr.appendChild(td);
        }
    }

    // trs are table rows
    let trs = tbody.children;
    for (i in days) {
        // For each day of the weekdays get the info of that day
        let currentDay = newTable[days[i]];
        
        // For each lecture in that day
        for (j in currentDay) {
            // Insert the info in the following way
            trs[j].children[i].innerHTML = `<strong>${currentDay[j].subject}</strong> ${currentDay[j].activity}<br>
                                            ${currentDay[j].time}<br>
                                            القاعة: ${currentDay[j].place}`;
        }
    }
    // To make this new node global
    newTableNode = table;
}