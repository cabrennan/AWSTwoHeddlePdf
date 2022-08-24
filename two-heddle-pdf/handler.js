'use strict';

const PDFKIT = require('pdfkit');
const AWS = require('aws-sdk');
const BUCKET = "cbrennanbuckettest";
const REGION = "us-east-1";
const S3 = new AWS.S3();

const WIDTH=8;
const PADDING=5;

// 72 points per inch 612 per portrait page
// 1 inch margin
// 8.5 portrait paper = 72-540 usable
// First line 72, last usable = 540


const generatePDF = async({title, text}) =>
    new Promise((resolve) => {
        const doc = new PDFKIT();
        const buffers = [];
        doc.font('Helvetica-Bold').text(title);
        doc.font('Helvetica');
        var text = "Diagram description....";
        doc.text(text);
        //24 across 12 holes, 12 slots
        var hole_rad = WIDTH;
        var rect_w = 2 * WIDTH;
        var x1 = 72;
        var y1 = 250;
        var y2 = 300;
        drawheddle(doc, x1, y1, "blue", PADDING, hole_rad, rect_w);
        drawheddle(doc, x1, y2, "green", PADDING, hole_rad, rect_w);     
    
        var x = 555;
        var y = 215;

        firstWarp(doc, x, y);
        divider(doc, 282, y);
        //console.log("set x to: " + x);
        firstWarp(doc, 260, y);

        var picks = "Pick instructions.....\n";

        picks += "Down\nOne Up\nTwo Up\nDown\nDown\nTwo Up\nOne Up\n\n";
        doc.text(picks, 100, 400)
            .font('Times-Roman', 16)

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdf = Buffer.concat(buffers);
            resolve(pdf);
        });
        doc.end();
    });
    
const savePDF = async (key, pdf) =>
    new Promise((resolve, reject) => {
      S3.putObject(
        {
          Bucket: BUCKET,
          Key: key,
          Body: pdf,
          ContentType: 'application/pdf',
          ACL: 'private',
        },
        (err, result) => {
          if (err) {
            console.error('ERROR!', err);
            reject(err);
          }
          if (result) {
            console.log('RESULT!', result);
            resolve(result);
          }
        }
      );
    });

const generateURI = (key) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

function straightWarp(doc, x, y, color) {
    console.log("inside straightWarp");
    var y2 = y + 130;
    
    doc.moveTo(x, y)
        .lineTo(x,y2)
        .lineWidth(2)
        .strokeColor(color)
        .stroke();

}

function divider(doc, x, y) {
    console.log("inside divider");
    var y1 = y-20;
    var y2 = y + 150;
    doc.moveTo(x, y1)
        .lineTo(x, y2)
        .lineWidth(3)
        .strokeColor("black")
        .stroke();
    //doc.restore();
}

function bentWarp(doc, x, y, color, dir) {
    console.log("Inside bentWarp");
    var y2 = y + 60;
    var x2 = x;
    
    if (dir == "r") {
        x+=2
        x2+=18;
    } else if(dir == "l") {
        x-=2;
        x2-= 18;
    }
    var y3 = y2 + 70;
    
    doc.moveTo(x, y)
        .lineTo(x,y2)
        .lineTo(x2,y2)
        .lineTo(x2,y3)
        .lineWidth(2)
        .strokeColor(color)
        .stroke();

}

function drawheddle(doc, start_x, start_y, color, dist, hole_radius, rect_width) {
    var rect_height=4*hole_radius;
    var h_adjust = 2*hole_radius;

    var x1 = start_x;
    var y1 = start_y;

    for(var i=1; i<=12; i++) {
        let h1_cgrad = doc.radialGradient(x1, y1, 0, 
            x1, y1, hole_radius);
        h1_cgrad.stop(0, color, 0)
            .stop(1, color, 1);

        doc.circle(x1, y1, hole_radius)
            .lineWidth(1)
            .fillOpacity(0.5)
            .fillAndStroke(color, color);

        x1 += hole_radius + dist;
        y1 -= h_adjust;

        doc.roundedRect(x1, y1, rect_width, rect_height, 5)
            .fillOpacity(0.5)
            .fillAndStroke(color, color);

        y1 += h_adjust;
        x1 += rect_width + dist + hole_radius;
    }
}

function nextSlotX(x) {
    x-= ((2*WIDTH) + (PADDING-2));
    return x;
}

function firstWarp(doc, x, y) {
    console.log("inside firstWarp");
    //straightWarp(doc, x, y, "red");
    //x-=3;
    console.log("X is now: " + x);
    console.log("Y is now: " + y);
    bentWarp(doc, x, y, "green", "l");
    x = nextSlotX(x);
    bentWarp(doc, x, y, "blue", "l");

    x = nextSlotX(x);
    x -=5;
    straightWarp(doc, x, y, "red");

    x = nextSlotX(x);
    bentWarp(doc, x, y, "blue", "l");

    x = nextSlotX(x);
    x-=2;
    bentWarp(doc, x, y, "green", "l");

    console.log("over here x is: " + x);
    console.log("over here y is: " + y);
    x = nextSlotX(x);
    x = nextSlotX(x);
    x-=2
    straightWarp(doc, x, y, "red");
    x -=5;
    straightWarp(doc, x, y, "red");

    x = nextSlotX(x);
    x = nextSlotX(x);

    bentWarp(doc, x, y, "green", "r");

    x = nextSlotX(x);
    x-=3;
    bentWarp(doc, x, y, "blue", "r");

    console.log("X is now: " + x);
    if (x > 72) {
        x = nextSlotX(x);
        x-=2;
        straightWarp(doc, x, y, "red");
    }

    if(x>72) {
        x = nextSlotX(x);
        x-=2;
        bentWarp(doc, x, y, "blue", "r");
    }

    if(x>72) {
        x = nextSlotX(x);
        straightWarp(doc, x, y, "red");
        x-=5;
        straightWarp(doc, x, y, "red");
    }


}


module.exports.generate = async({body}) => {
    const text = 'Two Heddle threading diagram';
    const key = "tmp/FirstHeddleDiagram.pdf";
    let data;
    try {
        data.JSON.parse(body);

    } catch(error) {
       data = { text: 'hit an error at line 221'};
       console.log("hit pending");
    }
    try {
        console.log('Generating document');
        const pdf = await generatePDF(data);
        console.log('Save to S3');
        await savePDF(key, pdf);
        return {
          statusCode: 200,
          body: generateURI(key),
        };
      } catch (error) {
        console.log('ERROR: ', error);
        return {
          statusCode: 500,
          body: JSON.stringify(error),
        };
      }

}
