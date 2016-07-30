window.onload = function () {
	// Set the name of the hidden property and the change event for visibility
	var hidden, visibilityChange; 
	if (typeof document.hidden !== "undefined") {
	  hidden = "hidden";
	  visibilityChange = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
	  hidden = "mozHidden";
	  visibilityChange = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
	  hidden = "msHidden";
	  visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
	  hidden = "webkitHidden";
	  visibilityChange = "webkitvisibilitychange";
	}

	// Back key event listener
	document.addEventListener('tizenhwkey', function(e) {
	  if (e.keyName === "back") {
	      try {
	          tizen.application.getCurrentApplication().exit();
	      } catch (ignore) {}
	  }
	});

	// Visibility change event listener
	document.addEventListener(visibilityChange, function () {
	  if (document[hidden]){
	  	pause = true;
	    document.removeEventListener('click', action);
	    document.removeEventListener('rotarydetent', move);
        document.removeEventListener('touchstart', move);
        document.removeEventListener('touchend', move);
	  } else {
	    pause = false;
	    countP = 0;
	    if (starting || gameOver) {
	    	document.addEventListener('click', action);
	    } else if (playing) {
	    	document.addEventListener('rotarydetent', move);
	    	document.addEventListener('touchstart', move);
	    	document.addEventListener('touchend', move);
	    }
	  }
	}, false);
	// tap event
	document.addEventListener('click', action);
    
    // Setting up the canvas
    var canvas = document.getElementById('canvas'),
        ctx    = canvas.getContext('2d'),
        cH     = ctx.canvas.height = 360,
        cW     = ctx.canvas.width  = 360;

    //General sprite load
    var imgHeart = new Image();
    imgHeart.src = 'images/heart.png'
    var imgRefresh = new Image();
    imgRefresh.src = 'images/refresh.png';
    var spriteExplosion = new Image();
    spriteExplosion.src = 'images/explosion.png';
    var imgRocketIcon = new Image();
    imgRocketIcon.src = 'images/rocket_icon.png';
    var imgRocket = new Image();
    imgRocket.src = 'images/rocket.png';
    var imgRocket1 = new Image();
    imgRocket1.src = 'images/rocket_1.png';
    var imgRocket2 = new Image();
    imgRocket2.src = 'images/rocket_2.png';
    var imgArrowUp = new Image();
    imgArrowUp.src = 'images/arrow_up.png';
    var imgArrowDown = new Image();
    imgArrowDown.src = 'images/arrow_down.png';
    var imgArrowUpOK = new Image();
    imgArrowUpOK.src = 'images/arrow_up_ok.png';
    var imgArrowDownOK = new Image();
    imgArrowDownOK.src = 'images/arrow_down_ok.png';
    var imgAngle = new Image();
    imgAngle.src = 'images/angle.png';
    var imgAngleOK = new Image();
    imgAngleOK.src = 'images/angle_ok.png';
    var imgTerrain = new Image();
    imgTerrain.src = 'images/terrain.png';
    var imgFuel = new Image();
    imgFuel.src = 'images/fuel.png';

    //Game
    var level      = 1,
        points     = 0,
        lives      = 4,
        count      = 0,
        pause      = false,
        countP     = 0,
        playing    = false,
        gameOver   = false,
    	starting = true,
        frame = 0;

    var record = localStorage.getItem("record");
    record = record == null ? 0 : record;
    
    //Player
    var player = new _player(cW/2-10,50);
    // Terrain
    var terrain = createMountains();

    function move(e) {
        if (e.type == 'rotarydetent') {
        	if (e.detail.direction === "CW") {
                if (player.angle < 1) {
                    player.angle += 0.1;
                }
            } else {
                if (player.angle > -1) {
                    player.angle -= 0.1;
                }
            }
        } else if (e.type == 'touchstart') {
            if (player.fuel > 0)
                player.boosting = true;
        } else if (e.type == 'touchend') {
            player.boosting = false;
        }

    }

    function action(e) {
        e.preventDefault();
        if(gameOver) {
            if(e.type == 'click') {
                gameOver   = false;
                player = new _player(cW/2-10,50);
                terrain = createMountains();
                starting = true;
                playing = false;
                count      = 0;
                points     = 0;
                lives = 4;
                level = 1;
                document.removeEventListener('rotarydetent', move);
                document.removeEventListener('touchstart', move);
                document.removeEventListener('touchend', move);
            } 
        } else if (starting) {
        	if(e.type == 'click') {
        		starting = false;
                playing = true;
                enemies = [];
                document.addEventListener('rotarydetent', move);
                document.addEventListener('touchstart', move);
                document.addEventListener('touchend', move);
        	}
        } else if (playing) {
            if(e.type == 'click') {
                playing = true;
                document.addEventListener('rotarydetent', move);
                document.addEventListener('touchstart', move);
                document.addEventListener('touchend', move);
            }
        }
        
    }

    function _player(x,y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 50;
        this.angle = 0;
        this.boosting = false;
        this.state = 0;
        this.stateX = 0;
        this.velocity = { x: 0, y: 0 };
        this.dead = false;
        this.landed = false;
        this.landedForFrames = 0;
        this.fuel = 100;
        this.applyGravity = function() {
            this.velocity.y += 0.015;
        }
        this.applyBoost = function() {
            this.velocity = geom.translate(this.velocity,
                                            geom.rotate({ x: 0, y: -0.035 },
                                                        { x: 0, y: 0 },
                                                        this.angle));
            this.fuel -= 0.5;
            if (this.fuel < 0) {
                this.fuel = 0;
            }
        }
        this.move = function() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
        this.checkBorderCollision = function() {
            var outside = false;
            var tolerance = 5;
            var p1 = geom.rotate({x: this.x, y:this.y}, {x:this.x+this.width/2, y:this.y}, this.angle);
            var p2 = geom.rotate({x: this.x+this.width, y:this.y}, {x:this.x+this.width/2, y:this.y}, this.angle);
            var p3 = geom.rotate({x: this.x, y:this.y+this.height}, {x:this.x+this.width/2, y:this.y}, this.angle);
            var p4 = geom.rotate({x: this.x+this.width, y:this.y+this.height}, {x:this.x+this.width/2, y:this.y}, this.angle);
            if ((geom.euclidianDistance(p1.x,p1.y,cW/2,cH/2) >= cH/2+tolerance) ||
                (geom.euclidianDistance(p2.x,p2.y,cW/2,cH/2) >= cH/2+tolerance) ||
                (geom.euclidianDistance(p3.x,p3.y,cW/2,cH/2) >= cH/2+tolerance) ||
                (geom.euclidianDistance(p4.x,p4.y,cW/2,cH/2) >= cH/2+tolerance)) {
                outside = true;
            }
            return outside;
        }
        this.checkTerrainCollision = function() {
            var collided = checkCollision();
            var result = {landed:false,crashed:false};
            if (collided.length > 0) {
                var landed = true;
                for (var i = 0; i < collided.length; i++) {
                    if (!collided[i][1].landingLine) {
                        landed = false;
                    }
                }

                if (landed == true && player.angle >= -0.1 && player.angle <= 0.1 && Math.round(Math.abs(player.velocity.y*100)) < 60) {
                    result.landed = true;
                } else {
                    result.crashed = true;
                }
            }

            return result;

        }
    }

    function explosion() {
        ctx.save();

        var spriteY,
            spriteX = 256;
        if(player.state == 0) {
            spriteY = 0;
            spriteX = 0;
        } else if (player.state < 8) {
            spriteY = 0;
        } else if(player.state < 16) {
            spriteY = 256;
        } else if(player.state < 24) {
            spriteY = 512;
        } else {
            spriteY = 768;
        }

        if(player.state == 8 || player.state == 16 || player.state == 24) {
            player.stateX = 0;
        }

        var p1 = geom.rotate({x:player.x+player.width/2, y:player.y+player.height/2}, {x:player.x+player.width/2, y:player.y}, player.angle);
        ctx.drawImage(
            spriteExplosion,
            player.stateX += spriteX,
            spriteY,
            256,
            256,
            p1.x-60,
            p1.y-60,
            120,
            120
        );
        player.state += 1;

        if(player.state == 31) {
            lives -= 1;
            if (lives == -1) {
                gameOver = true;
                playing  = false;
                document.removeEventListener('rotarydetent',move);
                document.removeEventListener('touchstart', move);
                document.removeEventListener('touchend', move);
            } else {
                player = new _player(cW/2-10,50);
            }
        }

        ctx.restore();
    }

    function createMountains() {
        var lines = [];

        var w = cW;
        var h = cH;

        var ordinate = function(min, max) {
          return min + (max - min) * Math.random();
        };

        var maxLineLength;
        var minLineLength;
        if (level < 3) {
            maxLineLength = 50;
            minLineLength = 40;
        } else if (level < 6) {
            maxLineLength = 40;
            minLineLength = 30;
        } else if (level < 9) {
            maxLineLength = 30;
            minLineLength = 25;
        } else if (level < 12) {
            player.fuel = 90;
            maxLineLength = 30;
            minLineLength = 25;
        } else if (level < 15) {
            player.fuel = 80;
            maxLineLength = 30;
            minLineLength = 25;
        } else if (level < 18) {
            player.fuel = 70;
            maxLineLength = 30;
            minLineLength = 25;
        } else if (level < 21) {
            player.fuel = 50;
            maxLineLength = 30;
            minLineLength = 25;
        }

        var p1 = { x: 0, y: ordinate(h * 0.7, h * 0.9) };
        while (p1.x < w) {
          if ((3 + lines.length) % 4 === 0) {
            var p2 = { x: p1.x + ordinate(minLineLength, maxLineLength), y: p1.y + Math.random() - 0.5 };
            lines.push({start:p1, end:p2, landingLine:true});
          } else {
            var p2 = { x: p1.x + ordinate(minLineLength, maxLineLength), y: ordinate(h * 0.7, h * 0.9) };
            lines.push({start:p1, end:p2, landingLine:false});
          }

          p1 = p2;
        }

        return lines;
    };  

    function checkCollision() {
        var boundingLines = [];
        var p1 = {x:player.x+player.width/2, y:player.y};
        var p2 = geom.rotate({x: player.x, y:player.y+player.height-7}, {x:player.x+player.width/2, y:player.y}, player.angle);
        var p3 = geom.rotate({x: player.x+player.width, y:player.y+player.height-7}, {x:player.x+player.width/2, y:player.y}, player.angle);
        boundingLines.push({start:p1, end:p2});
        boundingLines.push({start:p2, end:p3});
        boundingLines.push({start:p3, end:p1});

        var intersected = [];
        for (var i = 0; i < boundingLines.length; i++) {
          for (var j = 0; j < terrain.length; j++) {
            if (geom.linesIntersecting(boundingLines[i], terrain[j])) {
              intersected.push([boundingLines[i], terrain[j]]);
            }
          }
        }

        return intersected;
    }


    function start() {
        if (pause) {
            if (countP < 1) {
                countP = 1;
            }
        } else if (playing) {
        	//Clear
            ctx.clearRect(0, 0, cW, cH);

            // Level
            ctx.font = "bold 30px Helvetica";
            ctx.fillStyle = "rgba(52,52,52,0.4)";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.fillText(TIZEN_L10N["level"] + " " + level, cW/2,cH/2);

            // Draw terrain
            var pattern = ctx.createPattern(imgTerrain, "repeat");
            ctx.fillStyle = pattern;
            ctx.shadowBlur=20;
            ctx.shadowColor="black";
            ctx.beginPath();
            ctx.moveTo(terrain[0].start.x, terrain[0].start.y)
            for (var i = 0; i < terrain.length; i++) {
                ctx.lineTo(terrain[i].end.x,terrain[i].end.y);
            }
            ctx.lineTo(360,360);
            ctx.lineTo(0,360);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            for (var i = 0; i < terrain.length; i++) {
                if (terrain[i].landingLine) {
                    ctx.strokeStyle = "#747474";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(terrain[i].start.x, terrain[i].start.y);
                    ctx.lineTo(terrain[i].end.x, terrain[i].end.y);
                    ctx.stroke();
                    ctx.lineTo(terrain[i].end.x,terrain[i].end.y);
                }
            }


            if (!player.dead && !player.landed) {
                // Drawing player
                var currentRocketImg;
                if (player.boosting) {
                    if (frame % 4 == 0 || frame % 8 == 0) {
                        currentRocketImg = imgRocket1;
                    } else {
                        currentRocketImg = imgRocket2;
                    }
                } else {
                    currentRocketImg = imgRocket;
                }

                ctx.save();
                ctx.translate(player.x + player.width/2, player.y);

                ctx.rotate(player.angle);

                ctx.shadowBlur=20;
                ctx.shadowColor="black";
                ctx.drawImage(
                    currentRocketImg,
                    -player.width/2,
                    0,
                    player.width,
                    player.height
                );
                ctx.shadowBlur=0;

                ctx.restore();

                // Apply gravity
                player.applyGravity();
                if (player.boosting) {
                    player.applyBoost();
                }
                player.move();

                var borderCollision = player.checkBorderCollision();
                var terrainCollision = player.checkTerrainCollision();
                if (borderCollision) {
                    explosion();
                    player.dead = true;
                } else if (terrainCollision.crashed) {
                    explosion();
                    player.dead = true;
                } else if (terrainCollision.landed) {
                    player.landed = true;
                    points += Math.round(player.fuel/10.0) + 1;
                }

            } else if (player.dead) {
                explosion();
            } else if (player.landed) {
                if (player.landedForFrames <= 40) {
                    ctx.fillStyle = 'rgba(30,176,14,0.1)';
                    ctx.rect(0,0, cW,cH);
                    ctx.fill();
                    ctx.font = "bold 30px Helvetica";
                    ctx.fillStyle = "white";
                    ctx.textAlign = "center";
                    ctx.textBaseline = 'middle';
                    ctx.fillText(TIZEN_L10N["landed"], cW/2,cH/2);
                    ctx.font = "bold 20px Helvetica";
                    var newPts = Math.round(player.fuel/10.0) + 1;
                    ctx.fillText("+ " + newPts + " " + TIZEN_L10N["points"], cW/2,cH/2+40);
                } else {
                    player = new _player(cW/2-10,50);
                    terrain = createMountains();
                    level += 1;
                }
                player.landedForFrames += 1;
            }

            // Speed
            ctx.font = "14px Helvetica";
            ctx.fillStyle = "white";
            ctx.textBaseline = 'middle';
            ctx.textAlign = "left";
            var speed = Math.round(Math.abs(player.velocity.y*100));
            if (speed < 60) {
                ctx.fillStyle = '#1eb00e';
            }
            ctx.fillText(speed, cW/2+20,cH/2 + 155);

            var imgArrow;
            if (player.velocity.y >= 0) {
                if (speed < 60)
                    imgArrow = imgArrowDownOK;
                else 
                    imgArrow = imgArrowDown;
            } else {
                if (speed < 60)
                    imgArrow = imgArrowUpOK;
                else
                    imgArrow = imgArrowUp;
            }

            ctx.drawImage(
                imgArrow,
                cW/2+5,
                cH/2+148,
                9,
                12
            );

            // Angle
            ctx.fillStyle = 'white';
            var imgAngleCurr = imgAngle;
            var deg = Math.abs(Math.round(player.angle*10*6));
            if (deg <= 6) {
                ctx.fillStyle = '#1eb00e';
                imgAngleCurr = imgAngleOK;
            }
            ctx.drawImage(
                imgAngleCurr,
                cW/2-40,
                cH/2+148,
                12,
                12
            );
            ctx.fillText(deg + "°", cW/2-20,cH/2 + 155);


            // Draw lives
            var startX = 130;
            for (var i = 0; i < lives; i++) {
                ctx.drawImage(
                    imgHeart,
                    startX,
                    45,
                    20,
                    20
                );
                startX += 25;
            }

            // Fuel
            // The container 
            ctx.shadowBlur=20;
            ctx.shadowColor="black";
            ctx.strokeStyle = '#828282'; 
            ctx.strokeRect(cW/2-50, 25, 100+2, 10+2); 

            // Fuel icon
            ctx.drawImage(
                imgFuel,
                cW/2-70,
                25,
                12,
                12
            );
            startX += 25;
              
            // The bar 
            if (player.fuel >= 50) 
                ctx.fillStyle = '#11a900'; 
            else if (player.fuel >= 25) 
                ctx.fillStyle = '#fa6600'; 
            else if (player.fuel >= 0) 
                ctx.fillStyle = '#d10606'; 
                  
            ctx.fillRect(cW/2-50 + 1, 25 + 1, player.fuel * (100/100), 10); 
            ctx.shadowBlur=0;

        	
        } else if(starting) {
            //Clear
            ctx.clearRect(0, 0, cW, cH);
            ctx.beginPath();

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["title"], cW/2,cH/2 - 120);

            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["tap_to_play"], cW/2,cH/2 - 90);     
              
            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["instructions"], cW/2,cH/2 + 90);
              
            ctx.font = "13px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            wrapText(TIZEN_L10N["slow_down"], cW/2,cH/2 + 115, 220, 14);
            
            ctx.drawImage(
                    imgRocketIcon,
                    cW/2 - 64,
                    cH/2 - 74,
                    128,
                    128
                );
            
        } else if(count < 1) {
            count = 1;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.rect(0,0, cW,cH);
            ctx.fill();

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Game over",cW/2,cH/2 - 100);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["score"] + ": "+ points, cW/2,cH/2 + 100);

            record = points > record ? points : record;
            localStorage.setItem("record", record);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["record"] + ": "+ record, cW/2,cH/2 + 125);

            ctx.drawImage(imgRefresh, cW/2 - 23, cH/2 - 23);
        }
    }

    function init(){
        var game_loop = setInterval(function(){
           start();
           frame += 1;
           frame %= 30;
        }, 30);
    }

    init();

    //Utils
    var geom = {
        translate: function(point, translation) {
          return { x: point.x + translation.x, y: point.y + translation.y };
        },

        rotate: function(point, pivot, angle) {
          return {
            x: (point.x - pivot.x) * Math.cos(angle) -
              (point.y - pivot.y) * Math.sin(angle) +
              pivot.x,
            y: (point.x - pivot.x) * Math.sin(angle) +
              (point.y - pivot.y) * Math.cos(angle) +
              pivot.y
          };
        },

        euclidianDistance: function(x1,y1,x2,y2) {
            return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
        },

        linesIntersecting: function(a, b) {
          var d = (b.end.y - b.start.y) * (a.end.x - a.start.x) -
              (b.end.x - b.start.x) * (a.end.y - a.start.y);
          var n1 = (b.end.x - b.start.x) * (a.start.y - b.start.y) -
              (b.end.y - b.start.y) * (a.start.x - b.start.x);
          var n2 = (a.end.x - a.start.x) * (a.start.y - b.start.y) -
              (a.end.y - a.start.y) * (a.start.x - b.start.x);

          if (d === 0.0) return false;
          return n1 / d >= 0 && n1 / d <= 1 && n2 / d >= 0 && n2 / d <= 1;
        }
    }
    
    function wrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = ctx.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
      }


}