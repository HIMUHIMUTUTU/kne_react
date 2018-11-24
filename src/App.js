import React, { Component } from 'react';
import { render } from 'react-dom';
import './App.css';
import Rnd from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import io from "socket.io-client";

const common = { self_area_showtime: 2 * 60 * 1000, others_area_showtime: 2 * 60 * 1000, tss1: 15 * 60 * 1000, tss2: 10 * 60 * 1000, tss3: 5 * 60 * 1000, save_area_x: 0, temp_save_area1_x: 500, temp_save_area2_x: 650, temp_save_area3_x: 800, self_element_area_x: 950, others_element_area_x: 1100, all_area_top_y: 50, all_area_bottom_y: 980, max_disp_element_num: 8, text_size: 10 }
const common_save = { author_id: null, file_id: null, element:[], file:[] };

function detect_area(_x) {
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

class Menu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let con_disp = "connecting..."
    if (this.props.loaded) {
      con_disp = "connected"
    }
    return (
      <div className="control">
        <ul className="control_ul">
          <li>RollingTextComposter </li>
          <li>{con_disp}</li>
          <li><a href="http://localhost:8080/element_input" target="_blank">element_admin</a></li>
          <li><a href="http://localhost:8080/presentation" target="_blank">presentation</a></li>
          <li><a href="#" onClick={this.props.onClick}>save</a></li>
        </ul>
      </div>
    );
  }
}

class Drawrnd extends React.Component {

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    let initialpos = this.gen_initialpos(this.props.position, this.props.element_info.author_id);
    this.basic_style = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'solid 1px #fff'
    }
    this.state = {
      id: this.props.element_info.id,
      mode: this.props.element_info.mode,
      author_id: this.props.element_info.author_id,
      text: this.props.element_info.text,
      pos: { x: initialpos.x, y: initialpos.y },
      size: { width: 100, height: 100 },
      style: this.basic_style,
      modified: false,
      input_mode: false
    }
  }

  componentWillMount() {
    this.setState(
      this.state
    )
    console.log("componentwillmount");
  }

  componentWillReceiveProps(nextProps) {
    console.log("componentwillreceiveprops");
  }

  componentDidMount() {
    this.setState(this.state)
    setTimeout(() => { this.start_move({ x: this.state.pos.x, y: this.state.pos.y }) }, 1);
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
  calc_transition(_y, _showtime) {
    let t = _showtime * (common.all_area_bottom_y - _y) / (common.all_area_bottom_y - common.all_area_top_y);
    console.log(t);
    return "all " + t + "ms " + "0s linear";
  }

  gen_initialpos(_position, _author_id) {
    if (_position != 0) {
      return { x: _position[0], y: _position[1] }
    } else {
      if (_author_id == 1) {
        return { x: common.self_element_area_x + Math.random() * (common.others_element_area_x - 50 - common.self_element_area_x), y: common.all_area_top_y + Math.random() * (common.all_area_bottom_y - common.all_area_top_y) }
      } else {
        return { x: common.others_element_area_x + Math.random() * (1250 - common.others_element_area_x), y: common.all_area_top_y + Math.random() * (common.all_area_bottom_y - common.all_area_top_y) }
      }
    }
  }

  resize_by_text(_text) {
    let split_text = _text.split(/\n/);
    let rownum = split_text.length;
    let colnum = 0;
    for (let ci = 0; ci < split_text.length; ci++) {
      if (split_text[ci].length > colnum) {
        colnum = split_text[ci].length;
      }
    }
    this.setState({
      size: { width: colnum * common.text_size * 1.3, height: (rownum + 3) * common.text_size * 1.3 }
    });
  }

  change_pos(current_state) {
    this.setState(
      {
        pos: { x: current_state.x, y: current_state.y }
      }
    )
    console.log("pos_changed");
  }

  change_static_style(current_state) {
    let keys = Object.keys(current_state);
    let values = Object.values(current_state);

    let basic_style = JSON.parse(JSON.stringify(this.basic_style));
    for (let i = 0; i < keys.length; i++) {
      basic_style[keys[i]] = values[i];
    }

    this.setState(
      {
        style: basic_style
      }
    )
    console.log("style_changed");
  }

  start_move(current_state) {

    let area = detect_area(current_state.x)
    let showtime;
    if (area == "self") {
      showtime = common.self_area_showtime
    } else if (area == "temp_self1") {
      showtime = common.tss1
    } else if (area == "temp_self2") {
      showtime = common.tss2
    } else if (area == "temp_self3") {
      showtime = common.tss3
    } else if (area == "other") {
      showtime = common.others_area_showtime
    } else if (area == "save") {
      console.log("in save");
      return;
      console.log("in save no");
    }

    let new_transition = { "transition": this.calc_transition(current_state.y, showtime) };

    //set transition
    this.change_static_style(new_transition)

    //set y bottom of area
    this.setState(
      {
        pos: { x: current_state.x, y: common.all_area_bottom_y },
      }
    )
    console.log("start_move");
  }

  stop_move(current_state) {
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

  change_input_mode(current_state) {
    this.resize_by_text(this.state.text);
    this.setState(
      {
        input_mode: current_state.input_mode
      }
    );
    if (!current_state.input_mode) {
      this.setState(
        {
          text: current_state.element_text,
          modified: true
        }
      )
    }
    console.log("change_input_mode");
  }

  //after emelemt goes to bottom
  recycle(current_state) {
    //put top of area
    this.setState({ pos: { x: current_state.x, y: common.all_area_top_y } });
    this.change_static_style({});

    //start move
    setTimeout(() => { this.start_move({ x: current_state.x, y: common.all_area_top_y }) }, 1);
    console.log("recycle");
  }

  showstate() {
    console.log(this.state)
    console.log(this.inputRef.current);
  }

  render() {
    return (
      <Rnd
        onTransitionEnd={() => { this.recycle({ x: this.state.pos.x }) }}
        ref={this.inputRef}
        style={this.state.style}
        size={{ width: this.state.size.width, height: this.state.size.height }}
        position={{ x: this.state.pos.x, y: this.state.pos.y }}
        onDragStart={(e, d) => {
          console.log("ods");
          var rect = e.target.getBoundingClientRect();
          this.stop_move({ x: rect.left + window.pageXOffset, y: rect.top + window.pageYOffset });
          this.change_static_style({ 'border': 'solid 5px #00ff00' })
        }}
        onDrag={(e, d) => {
          this.setState({ pos: { x: d.x, y: d.y } });
          console.log("drag")
        }}
        onDragStop={(e, d) => {
          this.setState({ pos: { x: d.x, y: d.y } });
          this.change_static_style({ 'border': 'solid 1px #fff' })
          this.start_move({ x: d.x, y: d.y })
          console.log("dragstop")
        }}
        onResizeStart={(e, direction, ref, delta, position) => {
          var rect = e.target.getBoundingClientRect();
          //get x,y pos of element from right bottom point cor
          this.stop_move({ x: rect.left - this.state.size.width + window.pageXOffset, y: rect.top - this.state.size.height + window.pageYOffset });
          this.change_static_style({ 'border': 'solid 5px #00ff00' })
        }}
        onResize={(e, direction, ref, delta, position) => {
          console.log(ref.style.width);
          this.setState({
            size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) }
          });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          this.setState({ pos: { x: position.x, y: position.y } });
          this.change_static_style({ 'border': 'solid 1px #fff' })
          this.start_move({ x: position.x, y: position.y })
        }}
      >
        <Element_field input_mode={this.state.input_mode} element_text={this.state.text} onDoubleClick={(cim) => this.change_input_mode(cim)} onBlur={(cim) => this.change_input_mode(cim)} />
      </Rnd>
    );
  }
}

function Element_field(props) {
  if (props.input_mode) {
    return <textarea autoFocus className="element_input" onBlur={(event) => { props.onBlur({ input_mode: false, element_text: event.target.value }) }} defaultValue={props.element_text}></textarea>
  } else {
    return <div className="element_inside" onDoubleClick={() => { props.onDoubleClick({ input_mode: true, element_text: "" }) }}><pre>{props.element_text}</pre></div>
  }
}

class Button extends React.Component {

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  showstate() {
    let dob = this.inputRef.current;
    //get css 
    let sdob = getComputedStyle(dob)
    console.log(sdob.marginTop);
  }

  render() {
    return (
      <button ref={this.inputRef} type="button" onClick={() => { this.showstate() }}>PUSH</button>
    );
  }
}

/** 
class Element extends React.Component {
  constructor(props){
    super(props);
    this.state.element = element_data; 
  }
}
**/

//popup before display to select user and file
class Firstselect extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
  }

  render() {
    var self = this;
    //create list of users and files
    function createUserFileList() {
      console.log(self.props.user_info)
      let user_file_list = [];
      for (let ui = 0; ui < self.props.user_info.length; ui++) {
        let file_list = []

        for (let fi = 0; fi < self.props.user_info[ui].file.length; fi++) {
          //send author_id and file_id when click file 
          file_list.push(<li key={ui + "-" + fi}><a href="#" onClick={() => {self.props.onClick({author_id:ui, file_id:self.props.user_info[ui].file[fi]})}}>{self.props.user_info[ui].file[fi]}</a></li>);
        }

        user_file_list.push(<div key={ui}><div key={ui + "-div"}>{self.props.user_info[ui].name}</div><ul key={ui + "-ul"}>{file_list}</ul></div>);
      }
      return user_file_list;
    }

    return (
      <div className="firstselect">
        <div>select file from your file</div>
        {createUserFileList()}
      </div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { mode: "load", user_info: null }
    this.socket = io('localhost:8080');
  }

  //collect state of all element 
  collect_state() {
    let element = [];
    let file = [];
    for (let i = 0; i < this.inputRef.length; i++) {
      let ir = this.inputRef[i].current.state;
      if (ir.modified) {
        element.push({ id: ir.id, text: ir.text });
        ir.modified = false;
      }
      if (detect_area(ir.pos.x) == "save") {
        file.push({id:ir.id, x:ir.pos.x, y:ir.pos.y});
      }
    }

    console.log({ element: element, file: file });
    //save data on loacal
    //common_save.element = _data.element;
    //common_save.file = _data.file;
    this.socket.emit('save_new', {author_id:common_save.author_id, file_id:common_save.file_id, element: element, file: file });
  }

  //get author and file id from firstselect element
  fetch_author_file_id(_afid) {
    common_save.author_id = _afid.author_id;
    common_save.file_id = _afid.file_id;

    //emit request for load to server and receive file data
    //this.socket.emit('load_request', _afid);
    this.socket.emit('load_request_file_element_new', _afid);
    const self = this;
    //this.socket.on('load', function (_data) {
    this.socket.on('load_file_element_new', function (_data) {
      console.log(_data);
      self.inputRef = [];

      //limit max element num
      let disp_element_num = _data.element.length;
      if(disp_element_num > common.max_disp_element_num + _data.file.length){
        disp_element_num = common.max_disp_element_num + _data.file.length;
      }
      for (let i = 0; i < disp_element_num; i++) {
        self.inputRef.push(React.createRef());
      }
      console.log(self.inputRef.length);

      //save data on local
      common_save.element = _data.element;
      common_save.file = _data.file;

      //console.log(common_save);
      console.log(common_save);

      self.setState({ mode: "work" });
    });
  }

  componentDidMount() {
    //get user data and show file list
    this.socket.emit('load_request_user_new', "load_request_user");
    const self = this;
    this.socket.on('load_user_new', function (_data) {
      console.log(_data);
      self.setState({ mode: "select", user_info: _data });
    });
  }

  render() {
    const drawrnds = [];
    if (common_save.element.length != 0) {

      let work_ids = [];
      for (let i = 0; i < common_save.file.length; i++) {
        work_ids.push(common_save.file[i].id)
      }

      console.log(work_ids);
      let di = 0;
      let ri = 0;
      for (let i = common_save.element.length - 1; i >= 0; i--) {
        let wi = work_ids.indexOf(common_save.element[i].id);
        console.log(wi);
        if (wi >= 0) {
          drawrnds.push(
            <Drawrnd key={i} ref={this.inputRef[ri]} element_info={common_save.element[i]} position={[common_save.file[wi].x, common_save.file[wi].y]} />
          )
          ri++;
        } else {
          if (di < common.max_disp_element_num) {
            drawrnds.push(
              <Drawrnd key={i} ref={this.inputRef[ri]} element_info={common_save.element[i]} position={0} />
            )
            ri++;
            di++;
          }
        }
      }
    }
    return (
      <div>
        <div class="area_1"></div>
        <div class="area_21"></div>
        <div class="area_22"></div>
        <div class="area_23"></div>
        <div class="area_3"></div>
        <Menu loaded={this.state.mode} onClick={() => { this.collect_state() }} />
        {(() => {
          if (this.state.mode == "work") {
            return drawrnds
          } else if (this.state.mode == "select") {
            //return <Firstselect />
            return <Firstselect user_info={this.state.user_info} onClick={(_afid) => { this.fetch_author_file_id(_afid) }} />
          }
        })()}
        respect for textcomposter
      </div>

    );
  }
}

export default App;
