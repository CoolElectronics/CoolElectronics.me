window.onload = () => {
  var e = document.createElement("script");
  var app = new p5(apps[randomInt(0, apps.length - 1)]);
};
apps = [
  (p) => {
    var author = "coolelectronics";
    var numPointsSlider = 0,
      turnFractionSlider = 0;
    var LastNumPoints = 0,
      LastTurnFraction = 0;
    var numPoints = 0,
      turnFraction = 0;
    var points = [];
    var powSlider;
    var LastPower;
    var speedSlider;
    var angleOffset = 0;
    var size = randomInt(1, 5);
    p.setup = () => {
      p.createCanvas($(document).width() + 40, $(document).height()).parent(
        "bgapp"
      );
      numPointsSlider = randomInt(40, 10000);
      turnFractionSlider = 16;
      powSlider = randomInt(-30, 3);
      speedSlider = Math.random();
    };
    p.draw = () => {
      let xpower = powSlider / 20;
      numPoints = numPointsSlider;
      turnFraction = turnFractionSlider / 100;
      turnFraction = turnFraction + (0.0001 % 1);
      angleOffset = angleOffset + (((speedSlider / 480) * p.deltaTime) % 1);
      turnFraction = (1 + p.sqrt(5)) / 2;
      p.background(0);
      p.text("sketch by " + author, p.width - p.width / 3, 10);
      p.fill(255);
      for (let i = 0; i < points.length; i++) {
        p.ellipse(
          points[i].x * 200 + p.width / 2,
          points[i].y * 200 + p.height / 2,
          10
        );
      }
      if (
        numPoints != LastNumPoints ||
        turnFraction != LastTurnFraction ||
        xpower != LastPower ||
        true
      ) {
        points = [];
        for (let i = 0; i < numPoints; i++) {
          var dst = p.pow(i / (numPoints - 1), xpower);
          var angle = 2 * p.PI * turnFraction * i;
          var x = (dst * p.cos(angle + angleOffset)) / size;
          var y = (dst * p.sin(angle + angleOffset)) / size;
          points.push({ x: x, y: y });
        }
        LastNumPoints = numPoints;
        LastTurnFraction = turnFraction;
        LastPower = xpower;
      }
    };
  },
  (p) => {
    var author = "kusakari";
    var _aryInitRot = [];
    var _myObject;
    p.setup = () => {
      let canvasSize;
      if (p.windowWidth <= p.windowHeight) {
        canvasSize = p.windowWidth;
      } else {
        canvasSize = p.windowHeight;
      }
      let cv = p.createCanvas(
        $(document).width() + 20,
        $(document).height(),
        p.WEBGL
      );
      p.setAttributes("premultipliedAlpha", true);
      p.frameRate(30);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        _aryInitRot[i] = [p.random(2 * p.PI), p.random([-1, 1])];
      }

      _myObject = new Parts(350);
      $("#bgapp")[0].appendChild($("#defaultCanvas0")[0]);
    };
    p.draw = () => {
      p.ortho(
        -p.width / 2,
        p.width / 2,
        -p.width / 2,
        p.width / 2,
        0,
        p.width * 2
      );
      p.background(0);
      p.ambientLight(60);
      let ang = _aryInitRot[1][0] + p.frameCount / 100;
      p.directionalLight(255, 255, 255, -p.sin(ang), 1, -p.cos(ang));
      let c = p.height / 2 / p.tan(p.PI / 6);
      p.camera(c * p.sin(ang), 0, c * p.cos(ang), 0, 0, 0, 0, 1, 0);
      p.rotateZ(p.PI / 4);

      _myObject.update();
    };
    drawPart = (startX, startY, startZ, endX, endY, endZ, w, col) => {
      let angAxisZ = p.atan2(endY - startY, endX - startX);
      let distXY = p.dist(startX, startY, endX, endY);
      let angAxisY = -p.atan2(endZ - startZ, distXY);
      let distXYZ = p.dist(0, startZ, distXY, endZ);
      p.push();
      p.translate(startX, startY, startZ);
      p.rotateZ(angAxisZ);
      p.rotateY(angAxisY);
      p.translate(distXYZ / 2, 0, 0);
      p.ambientMaterial(col);
      p.box(distXYZ + w, w, w); //length + w
      p.pop();
    };

    class Part {
      constructor(
        startX,
        startY,
        startZ,
        endX,
        endY,
        endZ,
        w,
        totalTime,
        partCount,
        maxW
      ) {
        this.startX = startX;
        this.startY = startY;
        this.startZ = startZ;
        this.endX = endX;
        this.endY = endY;
        this.endZ = endZ;
        this.w = w;
        this.totalTime = totalTime;
        this.currentTime = 0;
        this.direction = true; //true -> extend, false -> shrink
        this.erase = false;
        this.col = p.color((255 * w) / maxW);
      }
      update() {
        let currentX;
        let currentY;
        let currentZ;
        if (this.direction == true) {
          //extend
          let ratio = (this.currentTime / this.totalTime) ** 0.5;
          currentX = this.startX + (this.endX - this.startX) * ratio;
          currentY = this.startY + (this.endY - this.startY) * ratio;
          currentZ = this.startZ + (this.endZ - this.startZ) * ratio;
          if (this.currentTime < this.totalTime) {
            this.currentTime++;
          }
          drawPart(
            this.startX,
            this.startY,
            this.startZ,
            currentX,
            currentY,
            currentZ,
            this.w,
            this.col
          );
        } else {
          //shrink
          let ratio =
            (1 - (this.currentTime - this.totalTime) / this.totalTime) ** 0.5;
          currentX = this.endX + (this.startX - this.endX) * ratio;
          currentY = this.endY + (this.startY - this.endY) * ratio;
          currentZ = this.endZ + (this.startZ - this.endZ) * ratio;
          this.currentTime++;
          if (this.currentTime > this.totalTime * 2) {
            this.erase = true;
          }
          drawPart(
            this.endX,
            this.endY,
            this.endZ,
            currentX,
            currentY,
            currentZ,
            this.w,
            this.col
          );
        }
      }
    }

    class Parts {
      constructor(numPart) {
        this.maxArea = p.width / 3.4;
        this.maxW = p.width / 10;
        this.t = 3;
        this.maxL = this.maxArea;
        this.parts = [];
        let w = p.max(p.width / 300, this.maxW * p.random() ** 12);
        let startX = -this.maxArea / 2;
        let startY = -this.maxArea / 2;
        let startZ = -this.maxArea / 2;
        let aryEndXYZ = this.randomDirection(startX, startY, startZ);
        while (
          p.abs(aryEndXYZ[0]) > this.maxArea ||
          p.abs(aryEndXYZ[1]) > this.maxArea ||
          p.abs(aryEndXYZ[2]) > this.maxArea
        ) {
          aryEndXYZ = this.randomDirection(startX, startY, startZ);
        }
        let endX = aryEndXYZ[0];
        let endY = aryEndXYZ[1];
        let endZ = aryEndXYZ[2];
        this.partCount = p.int(p.random(1000));
        this.parts.push(
          new Part(
            startX,
            startY,
            startZ,
            endX,
            endY,
            endZ,
            w,
            this.t,
            this.partCount,
            this.maxW
          )
        );
        this.numPart = numPart;
        this.isGenerate = false;
      }
      update() {
        for (let i = 0; i < this.parts.length; i++) {
          this.parts[i].update();
        }
        if (
          this.parts[this.parts.length - 1].currentTime >=
          this.parts[this.parts.length - 1].totalTime
        ) {
          this.isGenerate = true;
        }

        if (this.isGenerate == true && this.parts.length < this.numPart) {
          let w = p.max(p.width / 300, this.maxW * p.random() ** 12);
          let startX = this.parts[this.parts.length - 1].endX;
          let startY = this.parts[this.parts.length - 1].endY;
          let startZ = this.parts[this.parts.length - 1].endZ;
          let aryEndXYZ = this.randomDirection(startX, startY, startZ);
          while (
            p.abs(aryEndXYZ[0]) > this.maxArea ||
            p.abs(aryEndXYZ[1]) > this.maxArea ||
            p.abs(aryEndXYZ[2]) > this.maxArea
          ) {
            aryEndXYZ = this.randomDirection(startX, startY, startZ);
          }
          let endX = aryEndXYZ[0];
          let endY = aryEndXYZ[1];
          let endZ = aryEndXYZ[2];
          this.partCount++;
          this.parts.push(
            new Part(
              startX,
              startY,
              startZ,
              endX,
              endY,
              endZ,
              w,
              this.t,
              this.partCount,
              this.maxW
            )
          );
          this.isGenerate = false;
        }

        if (this.parts.length >= this.numPart) {
          this.parts[0].direction = false;
        }

        if (this.parts[0].erase == true) {
          this.parts.shift();
        }
      }
      randomDirection(startX, startY, startZ) {
        let endX = startX;
        let endY = startY;
        let endZ = startZ;
        let direction = p.random(["-x", "x", "-y", "y", "-z", "z"]);
        switch (direction) {
          case "-x":
            endX = startX + this.maxL * p.random(-1, 0);
            break;
          case "x":
            endX = startX + this.maxL * p.random(0, 1);
            break;
          case "-y":
            endY = startY + this.maxL * p.random(-1, 0);
            break;
          case "y":
            endY = startY + this.maxL * p.random(0, 1);
            break;
          case "-z":
            endZ = startZ + this.maxL * p.random(-1, 0);
            break;
          case "z":
            endZ = startZ + this.maxL * p.random(0, 1);
            break;
        }
        return [endX, endY, endZ];
      }
    }
  },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
