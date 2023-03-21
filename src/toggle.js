let toggle = document.querySelector('.toggle');
let controls = document.querySelector('.controls');
let controlstext = document.querySelector('.controlstext');
let gamepad = document.querySelector('.gamepad');
let toggleoverlay = document.querySelector('.toggleoverlay');
let textoverlay = document.querySelector('.textoverlay');
let overlay = document.querySelector('.overlay');
let horizontalgroup = document.querySelector('.horizontal-group');
let mooringimage = document.querySelector('.mooring-image');
let home  = document.querySelector('.home')
let login = document.querySelector('.login')
let loginbutton = document.querySelector('.loginbutton')
let logincontainer = document.querySelector('.logincontainer')
let closebtn = document.querySelector('.close-btn')
let editmode = document.querySelector('.editmode')

toggle.addEventListener ('click', () => {
    controls.classList.toggle('current');
    controlstext.classList.toggle('hidden');
    gamepad.classList.toggle('hidden');
    toggle.classList.toggle('hidden');
    home.classList.toggle('shifthome');
    login.classList.toggle('shiftlogin');
    editmode.classList.toggle('shiftedit')
}); 

gamepad.addEventListener ('click', () => {
    controls.classList.toggle('current');
    controlstext.classList.toggle('hidden');
    gamepad.classList.toggle('hidden');
    toggle.classList.toggle('hidden');
    home.classList.toggle('shifthome');
    login.classList.toggle('shiftlogin');
    editmode.classList.toggle('shiftedit')
});

toggleoverlay.addEventListener ('click', () => {
    overlay.classList.toggle('minimise');
    horizontalgroup.classList.toggle('hidden');
    textoverlay.classList.toggle('hidden');
    mooringimage.classList.toggle('hidden');
 }); 

 loginbutton.addEventListener('click', () => {
    login.classList.toggle('minimiselogin')
    logincontainer.classList.toggle('hidden')
    loginbutton.classList.toggle('hidden')
})

closebtn.addEventListener('click', () => {
    login.classList.toggle('minimiselogin')
    logincontainer.classList.toggle('hidden')
    loginbutton.classList.toggle('hidden')
})