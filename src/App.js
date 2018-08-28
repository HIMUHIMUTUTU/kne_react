import React, { Component } from 'react';
import { render } from 'react-dom';
import './App.css';
import Rnd from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import elements_data from './elements.json'
import io from "socket.io-client";
console.log(elements_data);

const common = {self_area_showtime:1 * 60 * 1000, others_area_showtime:1 * 60 * 1000, tss1:10* 60 * 1000, tss2: 5* 60 * 1000, tss3: 3 * 60 * 1000, save_area_x: 0, temp_save_area1_x: 500, temp_save_area2_x: 650, temp_save_area3_x: 800, self_element_area_x: 950, others_element_area_x: 1100, all_area_top_y: 50, all_area_bottom_y:980};

class Io extends React.Component{
  constructor(props){
      super(props);

      this.state = {
          username: '',
          message: '',
          messages: []
      };

      this.socket = io('localhost:8080');
      this.socket.emit('load_request', 'save_massage');
      this.socket.on('load', function (_data) {
        console.log(_data);
      })
  }

  render() {
    return (<div>control</div>);
  }
}

class Drawrnd extends React.Component {

  constructor(props){
    super(props);
    this.inputRef = React.createRef();
    let initialpos = this.gen_initialpos(this.props.element_info.author_id);
    this.basic_style = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'solid 1px #ddd'
    }
    this.state = {
        element: this.props.element_info,
        pos: { x: initialpos.x, y: initialpos.y },
        size: {width: 100, height: 100 },
        style: this.basic_style,
        input_mode: false
      }
  }

  componentWillMount(){
    this.setState(
      this.state
    )
    console.log("componentwillmount");
  }

  componentWillReceiveProps(nextProps){
    console.log("componentwillreceiveprops");
  }

  componentDidMount() {
    this.setState(this.state)
    setTimeout(() => {this.start_move({x: this.state.pos.x, y:this.state.pos.y})}, 1);
    /** 
    this.change_static_style({ "transition": 'all ' + common.others_area_showtime + 'ms 0s linear' })
    this.setState(
      {
        pos: { x: 900, y: common.all_area_bottom_y },
        style: this.basic_style
      }
    )
    **/
    console.log("initial_move");
  }

  //generate property of style transition when element is put in move area.
  calc_transition(_y, _showtime){
    let t = _showtime * (common.all_area_bottom_y - _y) / (common.all_area_bottom_y - common.all_area_top_y);
    console.log(t);
    return "all " + t +"ms " + "0s linear"; 
  }

  detect_area(_x) {
    if (_x <= common.temp_save_area1_x) {
      return "save"
    } else if (_x <= common.temp_save_area2_x && _x > common.temp_save_area1_x) {
      return "temp_self1"
    } else if (_x <= common.temp_save_area3_x && _x > common.temp_save_area2_x) {
      return "temp_self2"
    } else if (_x <= common.self_element_area_x && _x > common.temp_save_area3_x) {
      return "temp_self3"
    } else if (_x <= common.others_element_area_x && _x > common.self_element_area_x) {
      return "self"
    } else {
      return "other"
    }
  }

  gen_initialpos(_author_id){
    if (_author_id == 1) {
      return {x: common.self_element_area_x + Math.random() * (common.others_element_area_x - 50 - common.self_element_area_x), y: common.all_area_top_y +  Math.random() * (common.all_area_bottom_y - common.all_area_top_y)}
    }else{
      return {x: common.others_element_area_x + Math.random() * (1250 - common.others_element_area_x), y:  common.all_area_top_y +  Math.random() * (common.all_area_bottom_y - common.all_area_top_y)}
    }

  }
  change_pos(current_state) {
    this.setState(
      {
        pos: { x: current_state.x, y: current_state.y }
      }
    )
    console.log("pos_changed");
  }

  change_static_style(current_state){
    let keys = Object.keys(current_state);
    let values = Object.values(current_state);

    let basic_style= JSON.parse(JSON.stringify(this.basic_style));
    for(let i = 0; i < keys.length; i++){
      basic_style[keys[i]] = values[i];
    }

    this.setState(
      {
        style: basic_style
      }
    )
    console.log("style_changed");
  }

  start_move(current_state){

    let area = this.detect_area(current_state.x)
    let showtime;
    if(area == "self"){
      showtime = common.self_area_showtime 
    }else if(area == "temp_self1"){
      showtime = common.tss1 
    }else if(area == "temp_self2"){
      showtime = common.tss2 
    }else if(area == "temp_self3"){
      showtime = common.tss3 
    }else if(area == "other"){
      showtime = common.others_area_showtime 
    }else if(area == "save"){
      console.log("in save");
      return;
      console.log("in save no");
    }

    let new_transition = {"transition": this.calc_transition(current_state.y, showtime)};

    //set transition
    this.change_static_style(new_transition)

    //set y bottom of area
    this.setState(
      {
        pos: { x: current_state.x, y: common.all_area_bottom_y}, 
    }
    )
    console.log("start_move");
  }

  stop_move(current_state){
    //this.inputRef.current.props.position.x = current_state.x;
    this.inputRef.current.draggable.state.x = current_state.x;
    this.inputRef.current.draggable.state.y = current_state.y;
    this.setState(
      {
        pos: { x: current_state.x, y: current_state.y }, 
        style: this.basic_style 
      }
    ); 
    console.log("stop_move");
  }

  change_input_mode(current_state){
    this.setState(
      {
      input_mode: current_state.input_mode
     }
   );
   if(!current_state.input_mode){
    this.setState(
      {
       element : {text: current_state.element_text}
      }
    )
   }
    console.log("change_input_mode");
  }

  //after emelemt goes to bottom
  recycle(current_state){
    //put top of area
    this.setState({pos: { x: current_state.x, y: common.all_area_top_y }});
    this.change_static_style({});

    //start move
    setTimeout(() => {this.start_move({x: current_state.x, y:common.all_area_top_y})}, 1);
    console.log("recycle");
  }

  showstate(){
    console.log(this.state)
    console.log(this.inputRef.current);
  }

  render() {
    return (
      <Rnd
        onTransitionEnd={() => {this.recycle({x: this.state.pos.x})}}
        ref={this.inputRef}
        style={this.state.style}
        size={{ width: this.state.size.width, height: this.state.size.height }}
        position={{ x: this.state.pos.x, y: this.state.pos.y }}
        onDragStart={(e, d) => {
          console.log("ods");
          var rect = e.target.getBoundingClientRect();
          this.stop_move({ x: rect.left + window.pageXOffset, y: rect.top + window.pageYOffset });
          this.change_static_style({'border': 'solid 5px #00ff00'})
        }}
        onDrag={(e, d) => {
          this.setState({pos: { x: d.x, y: d.y }});
          console.log("drag")
        }}
        onDragStop={(e, d) => {
          this.setState({pos: { x: d.x, y: d.y }});
          this.change_static_style({'border': 'solid 1px #ddd'})
          this.start_move({x:d.x, y:d.y})
          console.log("dragstop")
        }}
        onResizeStart={(e, direction, ref, delta, position) => {
          var rect = e.target.getBoundingClientRect();
          //get x,y pos of element from right bottom point cor
          this.stop_move({ x: rect.left - this.state.size.width + window.pageXOffset, y: rect.top - this.state.size.height + window.pageYOffset });
          this.change_static_style({'border': 'solid 5px #00ff00'})
        }}
        onResize={(e, direction, ref, delta, position) => {
          console.log(ref.style.width);
          this.setState({
            size: {width: parseInt(ref.style.width), height: parseInt(ref.style.height) }
          });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          this.setState({pos: { x: position.x, y: position.y }});
          this.change_static_style({'border': 'solid 1px #ddd'})
          this.start_move({x:position.x, y:position.y})
        }}
      >
        <Element_field  onClick={() => {console.log("oc")}} input_mode={this.state.input_mode} element_text={this.state.element.text} onDoubleClick={(cim) => this.change_input_mode(cim)} onBlur={(cim) => this.change_input_mode(cim)} />
      </Rnd>
    );
  }
}

function Element_field(props){
      if(props.input_mode){
        return <textarea autoFocus className="element_input" onBlur={(event) => {props.onBlur({input_mode:false, element_text:event.target.value})}} defaultValue={props.element_text}></textarea>
      }else{
        return  <div className="element_inside" onDoubleClick={() => {props.onDoubleClick({input_mode:true, element_text:""})}}>{props.element_text}</div>
      }
}

class Button extends React.Component {

  constructor(props){
    super(props);
    this.inputRef = React.createRef();
  }

  showstate(){
    let dob = this.inputRef.current;
    //get css 
    let sdob = getComputedStyle(dob)
    console.log(sdob.marginTop);
  }

  render() {
    return (
      <button ref={this.inputRef} type="button" onClick={() => {this.showstate()}}>PUSH</button>
    );
  }
}

class Element extends React.Component {
  constructor(props){
    super(props);
    this.state.elements = elements_data; 
  }
}

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {elements: elements_data}; 
  }

  render() {
    const drawrnds = [];
    for (let i = 0; i < this.state.elements.length; i++) {
      drawrnds.push(
        <Drawrnd key={i} element_info={this.state.elements[i]} />
      )
    }
    return (
      <div>
        {/* <Io /> */}
        <div class="area_1"></div>
        <div class="area_21"></div>
        <div class="area_22"></div>
        <div class="area_23"></div>
        <div class="area_3"></div>
        {/* <Button onClick={() => this.buttonClick()}/> */}
        {drawrnds}
        {/*<div style="position: absolute;top: 5;left:250px">保存領域</div> */}
        {/*<div style="position: absolute;top: 5;left:650px">自分element流(流速小)</div> */}
        {/*<div style="position: absolute;top: 5;left:1000px">組織element流(流速大)<br />誰の物かは分からない</div> */}
      </div>
    );
  }
}
  
export default App;
