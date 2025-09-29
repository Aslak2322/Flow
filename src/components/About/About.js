import "./About.css";

function About() {
    return(
        <div className="about">
            <img src={'/Images/About.webp'}/>
            <h1>What is Flowriding?</h1>
                <div className="flexbox">
                <div className="invention">
                    <h2>The Invention of the Sport</h2>
                    <p>Flowriding is a popular alternative boardsport, which has roots in the late 20th century. Tom Lochtefeld's invention of the sheet wave was a key 
                    milestone. <br/> He started by eperimenting with pumping water over a ramp in his bathtub. This eventually resulted in the first flowrider being installed
                    in Texas in 1991. 
                    </p>
                </div>
                <div className="how">
                    <h2>How does it work?</h2>
                    <p>Water is pumped by about 30mph up a slight incline. This results in a perfect sheet wave that can be ridden.</p>
                </div>
                <div className="tricks">
                    <h2>Can i do Tricks?</h2>
                        <p> Yes! By pressing down on the tail of the board and dragging up with the front foot you can jump off the water. <br/>
                        When advanced you can flip spin and 
                        jump off and on the board. <br/> This results in a sport that can be described
                        as a mix of snowbaording, skimboarding, surfing and skatebaording</p>
                </div>
            </div>
        </div>
    )
}

export default About;