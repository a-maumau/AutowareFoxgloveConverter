import { ArrowPrimitive, CubePrimitive, CylinderPrimitive, LinePrimitive, Point3, SceneUpdate, SpherePrimitive, TextPrimitive } from "@foxglove/schemas";
import { PredictedObjects } from "./PredictedObjects";
import { TrackedObjects } from "./TrackedObjects";
import { DetectedObjects } from "./DetectedObjects";
import { Header } from "./Header";
import { Position } from "./Position";
import { Orientation } from "./Orientation";
import { Dimensions } from "./Dimensions";
import { ExtensionContext } from "@foxglove/studio";

type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const colorMap: Record<number, Color> = {
  0: { r: 1.0, g: 1.0, b: 1.0, a: 0.5 },  // UNKNOWN    // white  // hex: #FFFFFF
  1: { r: 1.0, g: 0.0, b: 0.0, a: 0.5 },  // CAR        // red    // hex: #FF0000
  2: { r: 0.0, g: 0.5, b: 1.0, a: 0.5 },  // TRUCK      // blue   // hex: #0080FF
  3: { r: 0.0, g: 0.5, b: 1.0, a: 0.5 },  // BUS        // blue   // hex: #0080FF
  4: { r: 0.0, g: 0.5, b: 1.0, a: 0.5},   // TRAILER    // pink   // hex: #FF8080
  5: { r: 1.0, g: 1.0, b: 0.5, a: 0.5 },  // MOTORCYCLE // yellow // hex: #FFFF80
  6: { r: 1.0, g: 0.5, b: 0.5, a: 0.5 },  // BICYCLE    // pink   // hex: #FF8080
  7: { r: 0.75, g: 1.0, b: 0.25, a: 0.5 },// PEDESTRIAN // green  // hex: #BFFF40
};

/*
seems each module has there own class definition
 - detecting object is not consistent
not sure is will align in all of it
currently using
- https://github.com/autowarefoundation/autoware_msgs/blob/4c3a1939520cd8ac9d05b0addf7286a0534de024/autoware_perception_msgs/msg/ObjectClassification.msg#L4
*/
//enum Classification {
//  UNKNOWN = 0,
//  CAR = 1,
//  BICYCLE = 2,
//  BUS = 3,
//  TRUCK = 4,
//  CYCLIST = 5,
//  MOTORCYCLE = 6,
//  PEDESTRIAN = 7,
//}
/*enum Classification {
  UNKNOWN = 0,
  CAR = 1,
  TRUCK = 2,
  BUS = 3,
  TRAILER = 4,
  MOTORBIKE = 5,
  BICYCLE = 6,
  PEDESTRIAN = 7
}*/

const classNameList: string[] = [
  "UNKNOWN",
  "CAR",
  "TRUCK",
  "BUS",
  "TRAILER",
  "MOTORBIKE",
  "BICYCLE",
  "PEDESTRIAN"
];

/*
type Linear = {
  x: number;
  y: number;
  z: number;
};
function angularToQuaternion(linear: Linear) {
  // seems z is 0
  //let length = Math.sqrt(linear.x*linear.x+linear.y*linear.y);
  let _x = linear.x// / length;
  let _y = linear.y// / length;

  let angle = Math.atan2(_y, _x) / 2;
  let sin_2 = Math.sin(angle*2);
  let cos_2 = Math.cos(angle);

  // only on x-y plane
  let q = {
    x: 0.0,
    y: 0.0,
    z: sin_2,
    w: cos_2,
  }

  return q
}
*/

function uint8ArrayToHexString(uint8Array: Uint8Array) {
  return Array.from(uint8Array, byte => {
      return byte.toString(16).padStart(2, '0');
  }).join('');
}



function createSceneUpdateMessage(
  header: Header,
  arrows: ArrowPrimitive[],
  cylinders: CylinderPrimitive[],
  lines: LinePrimitive[],
  spheres: SpherePrimitive[],
  texts: TextPrimitive[],
  cubes: CubePrimitive[]
): SceneUpdate {
  return {
    deletions: [],
    entities: [
      {
        id: spheres.length > 0 ? "predicted_objects" : "detected_objects",
        timestamp: header.stamp,
        frame_id: header.frame_id,
        frame_locked: false,
        lifetime: { sec: 1, nsec: 0 },
        metadata: [],
        arrows: arrows,
        cylinders: cylinders,
        lines: lines,
        spheres: spheres,
        texts: texts,
        triangles: [],
        models: [],
        cubes: cubes,
      },
    ],
  };
}

function createCubePrimitive(x: number, y:number, position: Position, orientation: Orientation, color: Color, dimensions: Dimensions): CubePrimitive
{
  return {
    color,
    size: { x, y, z: 0.1 },
    pose: {
      position: {
        x: position.x,
        y: position.y,
        // make the cube start at the ground level (z = 0)
        z: position.z - 0.5 * dimensions.z,
      },
      orientation,
    },
  };
}

function createCylinderPrimitive(x: number, y:number, position: Position, orientation: Orientation, color: Color, dimensions: Dimensions): CylinderPrimitive
{
  return {
    color,
    size: { x, y, z: 0.1 },
    pose: {
      position: {
        x: position.x,
        y: position.y,
        // make the cube start at the ground level (z = 0)
        z: position.z - 0.5 * dimensions.z,
      },
      orientation,
    },
    top_scale: 1.0,
    bottom_scale: 1.0
  };
}

function createTextPrimitive(text: string, position: Position, orientation: Orientation, color: Color): TextPrimitive {
  return {
    text: text,
    pose: {
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      orientation,
    },
    color: color,
    font_size: 15.0,
    scale_invariant: true,
    billboard: true,
  };
}

function createLinePrimitive(position: Position, orientation: Orientation, points: Point3[], color: Color): LinePrimitive {
  /*
  line type:
    LINE_STRIP 0 Connected line segments : 0-1, 1-2, ..., (n-1)-n
    LINE_LOOP  1 Closed polygon          : 0-1, 1-2, ..., (n-1)-n, n-0
    LINE_LIST  2 Individual line segments: 0-1, 2-3, 4-5, ...
  */

  return {
    type: 1,
    pose: {
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      orientation,
    },
    points: points,
    thickness: 3,
    color: color,
    scale_invariant: true,
    colors: [],
    indices: []
  };
}

/*
function createArrowPrimitive(position: Position, orientation: Orientation, arrows_len: number, color: Color): ArrowPrimitive {
  return {
    pose: {
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      orientation,
    },
    shaft_length: arrows_len,
    shaft_diameter: 0.1,
    head_length: 1.0,
    head_diameter: 0.4,
    color: color,
  };
}
*/

//function convertDetectedObjects(msg: DetectedObjects): SceneUpdate 
//{
//  const { header, objects } = msg;
//
//  const cubePrimitives: CubePrimitive[] = objects.reduce((acc: CubePrimitive[], object) => {
//    const { kinematics, shape, classification } = object;
//    const { pose_with_covariance } = kinematics;
//    const { position, orientation } = pose_with_covariance.pose;
//    const { dimensions } = shape;
//    const { x, y } = dimensions;
//
//    if (
//      classification.length === 0 ||
//      !classification[0] ||
//      classification[0].label === undefined
//    ) {
//      return acc;
//    }
//
//    const { label } = classification[0];
//    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
//
//    const predictedObjectCube: CubePrimitive = createCubePrimitive(x, y, position, orientation, color, dimensions);
//
//    acc.push(predictedObjectCube);
//    return acc;
//  }, []);
//
//  return createSceneUpdateMessage(header, [], cubePrimitives);
//}
function convertDetectedObjects(msg: DetectedObjects): SceneUpdate {
  const { header, objects } = msg;

  const cylinderPrimitives: CylinderPrimitive[] = [];
  const linePrimitives: LinePrimitive[] = [];
  const textPrimitives: TextPrimitive[] = [];
  const cubePrimitives: CubePrimitive[] = [];

  for (const object of objects) {
    const { kinematics, shape, classification } = object;
    const { pose_with_covariance } = kinematics;
    const { position, orientation } = pose_with_covariance.pose;
    const { dimensions } = shape;
    const { x, y } = dimensions;

    if (
      classification.length === 0 ||
      !classification[0] ||
      classification[0].label === undefined
    ) {
      continue;
    }

    const { label } = classification[0];
    
    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    if (label === 0) {
      const { points } = shape.footprint;
      linePrimitives.push(createLinePrimitive(position, orientation, points, color));
    } else {
      /*
        BOUNDING_BOX: 0
        CYLINDER    : 1
        POLYGON     : 2
      */
      if (shape.type === 0){
        cubePrimitives.push(createCubePrimitive(x, y, position, orientation, color, dimensions));
      } else if (shape.type === 1){
        cylinderPrimitives.push(createCylinderPrimitive(x, y, position, orientation, color, dimensions));
      } else {
        const { points } = shape.footprint;
        linePrimitives.push(createLinePrimitive(position, orientation, points, color));
      }
    }

    let cls_name = classNameList[label] ?? "UNKNOWN";
    const text = createTextPrimitive(cls_name, position, orientation, color);
    textPrimitives.push(text);
  }

  return createSceneUpdateMessage(header, [], cylinderPrimitives, linePrimitives, [], textPrimitives, cubePrimitives);
}

//function convertTrackedObjects(msg: TrackedObjects): SceneUpdate 
//{
//  const { header, objects } = msg;
//
//  const cubePrimitives: CubePrimitive[] = objects.reduce((acc: CubePrimitive[], object) => {
//    const { kinematics, shape, classification } = object;
//    const { pose_with_covariance } = kinematics;
//    const { position, orientation } = pose_with_covariance.pose;
//    const { dimensions } = shape;
//    const { x, y } = dimensions;
//
//    if (
//      classification.length === 0 ||
//      !classification[0] ||
//      classification[0].label === undefined
//    ) {
//      return acc;
//    }
//
//    const { label } = classification[0];
//    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
//
//    const predictedObjectCube: CubePrimitive = createCubePrimitive(x, y, position, orientation, color, dimensions);
//
//    acc.push(predictedObjectCube);
//    return acc;
//  }, []);
//
//  return createSceneUpdateMessage(header, [], cubePrimitives);
//}
function convertTrackedObjects(msg: TrackedObjects): SceneUpdate {
  const { header, objects } = msg;

  //const arrowPrimitives: ArrowPrimitive[] = [];
  const cylinderPrimitives: CylinderPrimitive[] = [];
  const linePrimitives: LinePrimitive[] = [];
  const textPrimitives: TextPrimitive[] = [];
  const cubePrimitives: CubePrimitive[] = [];

  for (const object of objects) {
    const { kinematics, shape, classification } = object;
    const { pose_with_covariance } = kinematics;
    //const { linear } = acceleration_with_covariance.accel;
    const { position, orientation } = pose_with_covariance.pose;
    const { dimensions } = shape;
    const { x, y } = dimensions;

    if (
      classification.length === 0 ||
      !classification[0] ||
      classification[0].label === undefined
    ) {
      continue;
    }

    const { label } = classification[0];
    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    // case for unknown
    if (label === 0) {
      const { points } = shape.footprint;
      linePrimitives.push(createLinePrimitive(position, orientation, points, color));
    } else {
      /*
      BOUNDING_BOX: 0
      CYLINDER    : 1
      POLYGON     : 2
      */
      if (shape.type === 0){
        cubePrimitives.push(createCubePrimitive(x, y, position, orientation, color, dimensions));
      } else if (shape.type === 1){
        cylinderPrimitives.push(createCylinderPrimitive(x, y, position, orientation, color, dimensions));
      } else {
        const { points } = shape.footprint;
        linePrimitives.push(createLinePrimitive(position, orientation, points, color));
      }
    }

    //const q = angularToQuaternion(linear);
    //arrowPrimitives.push(createArrowPrimitive(position, q, 3.0, color));

    let cls_name = classNameList[label] ?? "UNKNOWN";
    const text = createTextPrimitive(cls_name, position, orientation, color);
    textPrimitives.push(text);
  }

  return createSceneUpdateMessage(header, [], cylinderPrimitives, linePrimitives, [], textPrimitives, cubePrimitives);
}


//function convertPredictedObjects(msg: PredictedObjects): SceneUpdate 
//{
//  const { header, objects } = msg;
//
//  // create same thing but with spheres
//  const spherePrimitives: SpherePrimitive[] = objects.reduce(
//    (acc: SpherePrimitive[], object) => {
//      const { kinematics, classification } = object;
//      const { initial_pose_with_covariance, predicted_paths } = kinematics;
//
//      if (
//        classification.length === 0 ||
//        !classification[0] ||
//        classification[0].label === undefined
//      ) {
//        return acc;
//      }
//
//      const { label } = classification[0];
//      const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
//
//      // if the object is not unknown and has a predicted path, draw the path
//      if (
//        label !== Classification.UNKNOWN &&
//        Math.floor(initial_pose_with_covariance.pose.position.x) > 0
//      ) {
//        const spherePath: SpherePrimitive[] = predicted_paths[0]!.path.map((pose) => {
//          const sphere: SpherePrimitive = {
//            color,
//            size: { x: 0.25, y: 0.25, z: 0.25 },
//            pose,
//          };
//          return sphere;
//        });
//        acc.push(...spherePath);
//      }
//      return acc;
//    },
//    [],
//  );
//
//  const cubePrimitives: CubePrimitive[] = objects.reduce((acc: CubePrimitive[], object) => {
//    const { kinematics, shape, classification } = object;
//    const { initial_pose_with_covariance } = kinematics;
//    const { position, orientation } = initial_pose_with_covariance.pose;
//    const { dimensions } = shape;
//    const { x, y } = dimensions;
//
//    if (
//      classification.length === 0 ||
//      !classification[0] ||
//      classification[0].label === undefined
//    ) {
//      return acc;
//    }
//
//    const { label } = classification[0];
//    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
//
//    const predictedObjectCube: CubePrimitive = createCubePrimitive(x, y, position, orientation, color, dimensions);
//
//    acc.push(predictedObjectCube);
//    return acc;
//  }, []);
//
//  return createSceneUpdateMessage(header, spherePrimitives, cubePrimitives);
//}
function convertPredictedObjects(msg: PredictedObjects): SceneUpdate {
  const { header, objects } = msg;

  //const arrowPrimitives: ArrowPrimitive[] = [];
  const cylinderPrimitives: CylinderPrimitive[] = [];
  const linePrimitives: LinePrimitive[] = [];
  const spherePrimitives: SpherePrimitive[] = [];
  const textPrimitives: TextPrimitive[] = [];
  const cubePrimitives: CubePrimitive[] = [];

  for (const object of objects) {
    const { kinematics, shape, classification, object_id } = object;
    const { initial_pose_with_covariance, predicted_paths } = kinematics;
    //const { linear } = initial_acceleration_with_covariance.accel;
    const { position, orientation } = initial_pose_with_covariance.pose;
    const { dimensions } = shape;
    const { x, y } = dimensions;

    if (
      classification.length === 0 ||
      !classification[0] ||
      classification[0].label === undefined
    ) {
      continue;
    }

    const { label } = classification[0];
    const color = colorMap[label as keyof typeof colorMap] ?? { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    if (label === 0) {
      const { points } = shape.footprint;
      linePrimitives.push(createLinePrimitive(position, orientation, points, color));
    } else {
      /*
      BOUNDING_BOX: 0
      CYLINDER    : 1
      POLYGON     : 2
      */
      if (shape.type === 0){
        cubePrimitives.push(createCubePrimitive(x, y, position, orientation, color, dimensions));
      } else if (shape.type === 1){
        cylinderPrimitives.push(createCylinderPrimitive(x, y, position, orientation, color, dimensions));
      } else {
        const { points } = shape.footprint;
        linePrimitives.push(createLinePrimitive(position, orientation, points, color));
      }
    }

    //const q = angularToQuaternion(linear);
    //arrowPrimitives.push(createArrowPrimitive(position, q, 3.0, color));

    let cls_name = classNameList[label] ?? "UNKNOWN";
    const text = createTextPrimitive(cls_name.concat(": ", uint8ArrayToHexString(object_id.uuid)), position, orientation, color);
    textPrimitives.push(text);

    // if the object is not unknown and has a predicted path, draw the path
    //if (
    //  label !== Classification.UNKNOWN &&
    //  Math.floor(initial_pose_with_covariance.pose.position.x) > 0
    //) {
    //  const spherePath: SpherePrimitive[] = predicted_paths[0]!.path.map((pose) => {
    //    const sphere: SpherePrimitive = {
    //      color,
    //      size: { x: 0.25, y: 0.25, z: 0.25 },
    //      pose,
    //    };
    //    return sphere;
    //  });
    //  spherePrimitives.push(...spherePath);
    //}
    // visualize all path
    const spherePath: SpherePrimitive[] = predicted_paths[0]!.path.map((pose) => {
      const sphere: SpherePrimitive = {
        color,
        size: { x: 0.2, y: 0.2, z: 0.2 },
        pose,
      };
      return sphere;
    });
    spherePrimitives.push(...spherePath);
  }

  return createSceneUpdateMessage(header, [], cylinderPrimitives, linePrimitives, spherePrimitives, textPrimitives, cubePrimitives);
}


export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_auto_perception_msgs/msg/PredictedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertPredictedObjects,
  });
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_perception_msgs/msg/PredictedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertPredictedObjects,
  });

  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_auto_perception_msgs/msg/TrackedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertTrackedObjects,
  });
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_perception_msgs/msg/TrackedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertTrackedObjects,
  });

  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_auto_perception_msgs/msg/DetectedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertDetectedObjects,
  });
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_perception_msgs/msg/DetectedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertDetectedObjects,
  });
}
