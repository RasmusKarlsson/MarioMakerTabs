window.onload = function() 
{

  var TAB_OFFSET = 0;
  var MAX_TIME = 27;
  var SONG_LOADED = false;
  var NOTE_LENGTH = 0.2;

  var score = {};

  var parseTabText = function(text)
  {
    lines = text.split(/\r\n|\r|\n/g);
   
    var count = 0;
    var tablaturePattern = /([A-Ga-g]?[#b]?)([\-0-9\|\/\^\(\)\\hbpv]+)/;
    var tabNotes = [];
    for (var i in lines) {      
        var match = lines[i].match(tablaturePattern);
        if (match) {
          tabNotes.push(match[2]);
          count++;                
          // we found a line
          if (count === 6) {
            // we found an entire continuous section
            count = 0;
          }
        }
        else { 
          count = 0;
          // no match, reset our count (we have some sort of break)
        }      
    }
    tabsToNotes(tabNotes);
  }


  var tabsToNotes = function(tabNotes)
  {
    MAX_TIME = tabNotes[0].length;

    var allNotes = [];
    for(var i = 0; i < tabNotes.length;i++)
    {
      for(var j = 0; j < tabNotes[i].length;j++)
      {
        if(!isNaN(parseInt(tabNotes[i][j]))) 
        {
          var absoluteNote = calculateNote(i,parseInt(tabNotes[i][j]));
          allNotes.push({time:j,note:absoluteNote});
        }
      }
    }
    

    if(allNotes.length > 0)
    {
      score = allNotes;

      score.sort(function(a, b) {
          return parseFloat(a.time) - parseFloat(b.time);
      });

      drawTiles(allNotes);
      SONG_LOADED = true;
    }
      
  }


  var drawTiles = function(notes)
  {

    extendCanvas(notes);
    
  }

  var extendCanvas = function(notes)
  {
    var newCanvas = document.createElement("canvas");
    newCanvas.id = "newMarioMakerCanvas";
    var width = 27*32*Math.ceil(MAX_TIME/27);
    newCanvas.style.backgroundColor = '#5D94FB';
    newCanvas.width = width;
    newCanvas.height = 27*32;
    newContext = newCanvas.getContext("2d");


    var oldCanvas = document.getElementById("marioMakerCanvas") || document.createElement("canvas");
    newContext.drawImage(oldCanvas, 0, 0);


    var gridImage = new Image();
    gridImage.src = 'grid27x27.png';           
    gridImage.onload = function()
    {
        for(var i = 1; i<Math.ceil(MAX_TIME/27);i++)
          newContext.drawImage(gridImage, i*27*32, 0);

        var musicImage = new Image();
        musicImage.src = 'musicBlockSMB.png';

        musicImage.onload = function()
        {
          for(var i = 0;i<notes.length;i++)
          {
              var height = 26*32-notes[i].note*32;
              if(i == 0) console.log(height);
              if(height < 0)
                writeWarning("Notes got clipped, too HIGH pitched for Mario Maker. Try again with an offset of "+(TAB_OFFSET+height/32));

              if(notes[i].note < 0)
                writeWarning("Notes got clipped, too LOW pitched for Mario Maker. Try again with an offset of "+(-(notes[i].note-TAB_OFFSET)));
              newContext.drawImage(musicImage, notes[i].time*32, height);
          }
        }
    }

    document.body.appendChild(newCanvas);
    //document.body.removeChild(oldCanvas);
    oldCanvas.style.display = 'none';

    return newContext;
  }

  var writeWarning = function(warning)
  {
    if(document.getElementById("warnings").innerHTML.indexOf(warning) == -1)
      document.getElementById("warnings").innerText += warning + '\n';
  }


  var stringBandToIndex = [];
  stringBandToIndex[0] = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33];
  stringBandToIndex[1] = [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  stringBandToIndex[2] = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28];
  stringBandToIndex[3] = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
  stringBandToIndex[4] = [-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
  stringBandToIndex[5] = [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11];


  //A# is on index 0
  var calculateNote = function(string,band)
  {
    return stringBandToIndex[string][parseInt(band)] + TAB_OFFSET;
  }

  document.getElementById("submitTab").addEventListener("click", function(e){
      e.preventDefault();

      if(document.getElementById("newMarioMakerCanvas"))
      {
        loadStartCanvas();
        document.body.removeChild(document.getElementById("newMarioMakerCanvas"));
      }

      var tabText = document.getElementById("tabTextArea").value;
      TAB_OFFSET = parseInt(document.getElementById("selectOffset").value);
      parseTabText(tabText);
  });

  var marioMakerImage = new Image();
  marioMakerImage.src = 'grid27x27mario.png';           
  marioMakerImage.onload = function()
  {
      loadStartCanvas();
  }

  function loadStartCanvas()
  {
      var makerCanvas = document.getElementById("marioMakerCanvas");
      makerCanvas.style.backgroundColor = '#5D94FB';

      makerCanvas.style.display = 'block';
      var makerContext = makerCanvas.getContext("2d");
      makerContext.clearRect(0, 0, makerCanvas.width, makerCanvas.height);
      makerContext.drawImage(marioMakerImage, 0, 0);

      document.getElementById("warnings").innerText = "";
  }

  var selBox = document.getElementById('selectOffset');
  for(var i = 10; i >= -10; i--) {
      var opt = document.createElement('option');
      opt.innerHTML = i;
      opt.value = i;
      selBox.appendChild(opt);
  }
  selBox.selectedIndex = 10;

  var instrument;
  var volume;

  var playButton = document.getElementById("playButton");
  var stopButton = document.getElementById("stopButton");
  playButton.addEventListener("click", function(e){
    e.preventDefault();
    if(SONG_LOADED)
    {
     
        instrument = tsw.osc(110, 'square');
      volume = tsw.gain(0.0); // Half volume.
      tsw.connect(instrument, volume, tsw.speakers);
      instrument.start();
      playSong();
    }
  });

  stopButton.addEventListener("click", function(e){
    e.preventDefault();
    stopSong();
      //instrument.stop();
  });

  var interval;

  function playSong()
  {
    
    
    
    var maxCount = score.length;
    var index = 0;
    var timeIndex = 0;
    interval = setInterval(function(){
        // do your thing
        if(score[index].time == timeIndex)
        {

          var freq = indexToFrequency(score[index].note);


          for(var i = 0;i<11;i++)
          {
            volume.gain(i/20,tsw.now()+NOTE_LENGTH*(i/20));
            volume.gain(0.5-i/20,tsw.now()+NOTE_LENGTH*(10+i)/20);
          }

          instrument.frequency(freq);
       
          index++;
         
        }
        timeIndex++;

        
        if(index === maxCount) {
            clearInterval(interval);
            volume.gain(0.0,tsw.now());
        }
    }, 1000*NOTE_LENGTH);
  }

  function stopSong()
  {
    instrument.stop();
    clearInterval(interval);
  }

  function indexToFrequency(index)
  {
    var key = 38+index;
    return Math.pow(2,(key-49)/12)*440;
  }

}